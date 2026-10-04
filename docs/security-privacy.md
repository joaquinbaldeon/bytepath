# BytePath · seguridad y privacidad

> Documento técnico. No es una Política de Privacidad ni asesoría jurídica.
> Describe lo que hace el **código** de este repositorio. Lo que depende de cómo
> se despliegue cada instancia (proveedor, plan, región, hosting) está marcado
> como **depende de la instalación**.

Principios: recopilar solo lo necesario para prestar el servicio, no vender
datos, no perfilar, sin analítica ni publicidad de terceros, proveedores externos
solo cuando hacen falta.

---

## 1. Qué datos recoge BytePath y dónde viven

| Dato | Origen | Dónde | ¿Necesario? | Conservación |
|---|---|---|---|---|
| Correo | Registro | `auth.users` (Supabase Auth) | Sí (identificar la cuenta, confirmar, recuperar) | Hasta eliminar la cuenta |
| Contraseña | Registro / cambio | Hash en `auth.users` (Supabase). Pasa por el servidor de BytePath en tránsito (TLS) y no se guarda ni se registra | Sí | Hasta eliminar la cuenta |
| Nombre de usuario | Registro | `profiles.username` (**fuente de verdad**). También queda en `auth.users.raw_user_meta_data` (ver §8) | Sí | Hasta eliminar la cuenta |
| Aceptación de Términos | Registro / `/cuenta` | `legal_acceptances` (usuario, tipo, versión, fecha) | Sí | Hasta eliminar la cuenta |
| Progreso | Uso | `lesson_activations` | Sí | Hasta eliminar la cuenta |
| Instantánea del quiz en curso | Uso | `lesson_activations.quiz_state` (≤ 4 KB) | Sí, mientras dura el quiz | Se borra al completar la lección |
| Energía, saldo e historial de tokens | Uso | `user_energy`, `user_tokens`, `token_transactions` | Sí | Hasta eliminar la cuenta |
| Suscripción (solo manual) | Administración | `subscriptions` | Solo si se usa Premium | Hasta eliminar la cuenta |
| Contadores de límite | Uso | `rate_limits`: `bucket`, `subject` (id de usuario, HMAC de la IP o `global`), `window_start`, `hits` | Sí (evitar abusos) | Sin historial. Una fila caducada (> 2 días) se borra en una llamada posterior al limitador (hasta 20 por llamada); sin actividad, permanece. No hay plazo exacto |
| Código de los desafíos | Uso | **No se guarda** en BytePath; se envía a Judge0 | Sí (en tránsito) | Judge0: depende de la instalación |
| Opción marcada en el quiz | Uso | **No se guarda**; solo se corrige | — | — |
| Sesión | Login | Cookies `sb-<ref>-auth-token*` (ver §5) | Sí | 30 días sin uso |
| Tema claro/oscuro | Navegador | `localStorage["bytepath-theme"]` | Preferencia | Indefinida (en el navegador) |

## 2. Qué NO recogemos

Edad o fecha de nacimiento, nombre real, teléfono, dirección, foto, documento de
identidad, datos de pago, ubicación, contactos, ficheros subidos, IP en claro,
user-agent, huellas del dispositivo, analítica, píxeles, cookies publicitarias,
perfiles de uso para publicidad, la opción marcada en cada pregunta, el código de
los desafíos.

## 3. Qué se envía a Judge0

Cadena: navegador → `POST /api/runs` (mismo dominio) → servidor → Judge0 → servidor → navegador.

- **Se envía**, por cada caso de prueba: `language_id`, `source_code` (base64),
  `stdin` (la entrada del caso, sale del servidor), `cpu_time_limit` (2 s),
  `wall_time_limit` (6 s), `memory_limit` (128 MB). Cabecera de clave de API
  solo si `JUDGE0_API_KEY` está definida.
- **NO se envía**: cookies, id de usuario, nombre, correo, curso, lección,
  `challengeId`, salida esperada.
- **Judge0 puede conocer**: la IP del **servidor** de BytePath (no la del
  usuario), la hora y el volumen de uso, y el contenido del código, que es texto
  libre y **podría incluir lo que el usuario escriba en él** (nombres,
  comentarios, credenciales pegadas por error).
- **Retención**: Judge0 guarda cada envío asociado a un token (así funciona la
  consulta que hace BytePath). Cuánto lo conserva depende del proveedor
  configurado (instancia pública, servicio gestionado o instancia propia; ver
  `docs/deploy.md` §6).
- **Protecciones** (en este orden, y nada llega a Judge0 si falla una): sesión
  (401, antes de leer el cuerpo) → tamaño y forma del cuerpo → el desafío existe
  (404) → el curso y la lección enviados son los del desafío según el contenido
  (400) → la lección está desbloqueada para ese usuario según su progreso en la
  base de datos (403; 503 si no se puede leer el progreso) → cupo de 12/min y
  300/día por usuario (429). El cupo solo se consume si todo lo anterior pasa.
  El código, el `stdin`, los tokens de Judge0 y las respuestas completas no se
  escriben en logs (solo tipo de error, un mensaje propio corto y un código de
  causa); los tokens no se devuelven al navegador, y de los casos ocultos solo se
  devuelve si pasaron.

## 4. Qué queda bajo control de terceros

| Tercero | Qué hace | Qué recibe | Retención conocida |
|---|---|---|---|
| Supabase | Auth y base de datos | Correo, hash de contraseña, metadatos, todos los datos de §1; IP y user-agent de las peticiones (el navegador habla con Supabase para renovar la sesión y leer su perfil) | Depende de la instalación (logs, auditoría de Auth, backups según plan) |
| Judge0 | Ejecutar código | §3 | Depende del proveedor |
| Hosting de la app | Servir BytePath | Todo el tráfico: IP, user-agent, cookies, cuerpos (incl. contraseña en tránsito), código enviado a `/api/runs`, logs | Depende del hosting |
| Emisor de correo de Supabase | Correos de confirmación y recuperación | Correo del usuario | Depende de la instalación (SMTP de Supabase o propio) |

No hay más proveedores. No hay ninguna pasarela de pago integrada: si un
comentario del código menciona una (Stripe, Mercado Pago), es un plan futuro, no
una integración. Las fuentes se sirven desde el propio
dominio (`next/font`), sin peticiones a Google desde el navegador.

## 5. Mecanismos de seguridad

### Sesión y cookies (`src/lib/supabase/cookies.ts`, `src/lib/site-url.ts`)
- `Secure` según `serverCookiesSecure()`: si `SITE_URL` es `https://…` → Secure;
  si es `http://…` (demo en red local) → sin Secure, porque el navegador
  descartaría la cookie; sin `SITE_URL` → Secure en `next start`, sin Secure en
  `next dev`. No se usa ninguna cabecera de la petición (`Host`,
  `X-Forwarded-Proto`) para decidirlo. En el navegador se usa el protocolo real
  de la página. `localhost` y `127.0.0.1` aceptan cookies Secure por http.
- `SameSite=Lax`, `path=/`, sin dominio (solo el host).
- Duración **30 días** sin uso. `@supabase/ssr` ignora `maxAge`, así
  que se aplica en nuestras funciones `setAll` (servidor, proxy y navegador).
- **No HttpOnly**, a propósito: el cliente de Supabase del navegador lee y
  renueva la sesión (barra, cierre de sesión, `onAuthStateChange`). La cookie
  contiene los tokens y el objeto de usuario (correo, `user_metadata`).
  Mitigación: CSP, y BytePath no pinta HTML proporcionado por usuarios.
- Cierre de sesión: `signOut()` global en el navegador + Server Action; se borran
  las cookies. Un JWT ya emitido es válido hasta que caduca (lo decide Supabase).
- Cambio de contraseña: tras cambiarla, `signOut({ scope: "others" })` revoca las
  demás sesiones (sus refresh tokens) y conserva la actual. Si la revocación
  falla, la contraseña queda cambiada y `/cuenta` lo dice. Los JWT ya emitidos a
  otras sesiones siguen valiendo hasta que caducan (duración del JWT: Supabase).

### Enlaces de correo y redirecciones (`src/app/auth/confirmar/route.ts`)
- El origen público sale solo de `SITE_URL`; sin ella, las redirecciones son
  relativas (`Location: /cursos`) y los correos usan el `Origin` de la petición
  (Supabase solo acepta los que estén en su lista de Redirect URLs).
- `next` solo acepta rutas internas de una lista (`/cursos`, `/cuenta`,
  `/cuenta/contrasena`); `https://…`, `//…`, `/\…`, `javascript:` → `/cursos`.
  La recuperación siempre lleva a `/cuenta/contrasena`.

### Cabeceras (`next.config.ts`)
CSP (`default-src 'self'`, scripts solo propios, `connect-src` solo el sitio y
Supabase, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`,
`Permissions-Policy` restrictiva, `X-Frame-Options: DENY`, HSTS en producción,
sin `X-Powered-By`. `script-src` y `style-src` llevan `'unsafe-inline'`
(justificado en el propio archivo); `'unsafe-eval'` solo en desarrollo.

### Base de datos (RLS y privilegios)
Cada tabla con datos de usuario tiene **dos cerraduras**: RLS (solo lectura de
las filas propias, `auth.uid() = user_id`) y privilegios de tabla (anon nada;
authenticated solo `SELECT`). Ninguna política permite `INSERT`/`UPDATE`/`DELETE`:
el username tampoco se cambia desde el navegador (no hay interfaz para ello).
Toda escritura pasa por funciones `SECURITY DEFINER` con `search_path = ''`.

| Función | Quién la ejecuta | Usuario | Escribe en |
|---|---|---|---|
| `get_account_state`, `refill_energy_with_tokens` | authenticated | `auth.uid()` | refill: energía, tokens, historial |
| `accept_legal_document(tipo, versión)` | authenticated | `auth.uid()` (sin parámetro de usuario) | `legal_acceptances` (solo inserta, y solo la versión **vigente**) |
| `consume_run_quota()` | authenticated | `auth.uid()` | `rate_limits` (filas del propio usuario) |
| `start_lesson`, `record_quiz_answer`, `save_quiz_state`, `reset_quiz_progress`, `record_challenge_pass`, `complete_lesson` | **solo service_role** | `p_user`, que pone el servidor a partir de la cookie validada | progreso, energía, tokens |
| `consume_rate_limit`, `rate_limit_blocked` | solo service_role | sujeto que pone el servidor | `rate_limits` (la segunda solo lee) |
| `username_available` | solo service_role | — | nada |
| `handle_new_user`, `record_signup_terms`, `touch_updated_at` | solo triggers | `NEW.id` | `profiles`, `legal_acceptances` |
| `is_premium`, `_energy_view`, `_rate_limit_hit`, `current_legal_version` | nadie desde el cliente | — | `_rate_limit_hit`: `rate_limits` |

**Versión vigente de un documento legal**: la de `published_at` más reciente que
no sea futura (fecha de America/Lima); a igual fecha, la de número de versión
mayor. Publicar una versión nueva = insertar una fila en `legal_documents`. Las
aceptaciones ya registradas no se modifican nunca.

`supabase/security-tests.sql` comprueba: A no lee ni modifica datos de B, nadie
inserta ni borra directamente, ninguna función con parámetro `uuid` es
ejecutable por anon/authenticated, todas las `SECURITY DEFINER` fijan
`search_path`, y el borrado de una cuenta no deja filas.

### Límites de peticiones (`src/lib/security/rateLimit.ts`, `supabase/security.sql`)
| Límite | Sujeto | Tope | Si no se puede comprobar |
|---|---|---|---|
| Ejecuciones (`consume_run_quota`, con la sesión del usuario; no necesita la clave de servicio) | usuario | 12/min y 300/día | **No se ejecuta** (503) |
| Comprobación de username en el registro | IP de confianza; además tope global | 20 / 10 min por IP; 120 / 10 min en total | Deja pasar (lo decide el trigger) |
| Recuperación de contraseña | IP de confianza | 5 / 15 min | Deja pasar |
| Inicio de sesión: **fallos** | IP de confianza | 20 fallos / 15 min (los accesos correctos no cuentan) | Deja pasar |
| Contraseña actual (cambio y eliminación): **fallos** | usuario | 5 fallos / 15 min | Deja pasar |

**IP del cliente** (`src/lib/security/clientIp.ts`): por defecto BytePath **no
confía en ninguna cabecera** (`X-Forwarded-For`, `X-Real-IP`… las puede escribir
cualquiera). Sin configuración, los límites «por IP» no se aplican y quedan los
límites por usuario, el tope global del username y los propios de Supabase Auth.
Con `TRUSTED_IP_HEADER` (`x-real-ip`, `x-forwarded-for`, `cf-connecting-ip`,
`x-vercel-forwarded-for`) se usa esa cabecera; en las de lista, la entrada que
añadió el proxy de confianza (`TRUSTED_PROXY_COUNT`, por defecto 1, contando
desde la derecha).

> **Configúralo solo si la aplicación es accesible EXCLUSIVAMENTE a través de
> ese proxy** y el proxy escribe (no reenvía) la cabecera. Si alguien puede
> llegar directamente al servidor de Next, puede inventarse la cabecera
> (comprobado en pruebas locales).

La IP se guarda como HMAC-SHA256 con una clave del servidor (la clave de
servicio), recortado. Es un **seudónimo, no una anonimización**: quien tenga la
clave y una IP candidata puede comprobar si coincide. Solo se usa para contar
intentos; no se cruza con la cuenta ni se guarda la IP en claro.

**Dependencia de Supabase Auth**: el inicio de sesión, el registro y la
recuperación los hace el servidor de BytePath, así que Supabase ve la IP del
servidor. Sus límites por IP (panel: Auth > Rate Limits) pueden terminar
contando a todos los usuarios juntos. Revísalos antes de abrir el registro.

**Enumeración de usernames (residual)**: el formulario de BytePath no dice si
un username existe fuera de la comprobación limitada. Pero quien llame
directamente a `auth/v1/signup` de Supabase con la clave publicable obtiene un
error si el username ya existe (el trigger `handle_new_user` falla con un
mensaje genérico) y éxito si no. Eso depende de Supabase y está limitado por sus
límites de registro. Evitarlo del todo exigiría renombrar en silencio o mover el
username fuera del alta; no se ha hecho por sus efectos secundarios.

**Reautenticación por enlace** (`src/lib/auth/reauth.ts`): cambiar la contraseña
sin la actual solo se permite si la sesión contiene, en los últimos 15 min, un
método de la lista explícita `recovery` u `otp`. Cualquier otro (oauth, sso,
magiclink, email, anonymous, mfa…) exige la contraseña actual. Eliminar la cuenta
siempre la exige.

**Limpieza de `rate_limits`**: cada llamada al limitador borra como mucho 20
filas con más de 2 días (`FOR UPDATE SKIP LOCKED`, índice en `window_start`). El
crecimiento queda acotado mientras haya uso; no hay borrado programado (sin cron).

### Logs (`src/lib/supabase/errors.ts`)
Se registran `code`, un `message` saneado (valores entre comillas → `[valor]`,
se conservan nombres de tablas/restricciones) y `hadDetails`. **Nunca**
`details` (ahí PostgreSQL pone "Failing row contains (…)"), contraseñas, tokens,
cookies, código de usuario ni cuerpos de respuesta de Judge0.

## 6. Gestión de la cuenta

| Función | SQL | Backend | Frontend | Cómo se prueba |
|---|---|---|---|---|
| Recuperar contraseña | Supabase Auth | `requestPasswordResetAction` (respuesta idéntica exista o no la cuenta) | `/recuperar` → enlace → `/cuenta/contrasena` | A mano, en local |
| Cambiar contraseña | Supabase Auth | `updatePasswordAction` (pide la actual salvo acceso por enlace en los últimos 15 min) | `/cuenta/contrasena` | A mano, en local |
| Eliminar cuenta | Cascada en todas las tablas | `deleteAccountAction` (contraseña + "ELIMINAR", `auth.admin.deleteUser`, verificación de filas) | `/cuenta` | A mano, en local; `security-tests.sql` (sin filas huérfanas) |
| Descargar mis datos | RLS | `GET /api/cuenta/exportar` (JSON, con la sesión del usuario) | `/cuenta` | A mano, en local |
| Aceptar Términos vigentes | `accept_legal_document` | `acceptCurrentTermsAction` | `/cuenta` (si no consta) | `legal-tests.sql` |
| Cambiar username | Bloqueado (sin política ni privilegio) | — | — (sin interfaz; se pide por correo al contacto de la instancia) | `security-tests.sql` |
| Borrar o reiniciar todo el progreso | — | — | — | No existe (solo reiniciar un quiz en curso) |

**Qué NO borra la eliminación**: copias de seguridad de Supabase, logs de
Supabase y del hosting, registros de auditoría de Auth (según Supabase), y el
código ya enviado a Judge0. Los contadores por IP (sin usuario) no se borran con
la cuenta; se borran cuando llevan más de 2 días sin usarse y hay actividad
posterior en el limitador (sin plazo exacto).

## 7. Despliegue y configuración necesaria

El paso a paso completo está en [`docs/deploy.md`](deploy.md). La idea es
**expandir → desplegar → verificar → contraer**, para no romper nada entre una
versión del esquema y otra:

1. **Expandir** (SQL Editor): `schema.sql` (si no estaba) → `setup.sql` →
   `verify.sql` (todo OK). Es aditivo, idempotente y compatible con el código
   anterior: el registro sin `terms_version` sigue funcionando porque
   `legal_config.require_terms_on_signup` empieza en `false`.
2. **Desplegar** el código. Variables de servidor (nunca con prefijo `NEXT_PUBLIC_`):
   - `SUPABASE_SERVICE_ROLE_KEY`: progreso, límites anónimos y de fallos,
     eliminación de cuenta, comprobación de username. **Solo servidor**: la
     leen módulos `server-only`. Las ejecuciones de `/api/runs` no la necesitan.
   - `SITE_URL=https://<dominio>` (correos, redirecciones, cookies Secure).
   - `TRUSTED_IP_HEADER` / `TRUSTED_PROXY_COUNT` solo si se cumple el aviso de §5.
   - `JUDGE0_URL` (+ `JUDGE0_API_KEY` / `JUDGE0_API_HOST` si el proveedor lo exige).

   Si el código llega antes que el SQL, `/api/runs` responde 503 (no puede
   comprobar el cupo) y el registro funciona sin guardar la aceptación.
3. **Verificar**: un registro de prueba deja su fila en `legal_acceptances`; una
   ejecución de prueba funciona; `verify.sql` sigue en OK.
4. **Contraer**: `supabase/migrations/0002_require_terms_on_signup.sql` (a partir
   de aquí un alta sin la versión vigente se rechaza) y, si quieres que solo el
   servidor pueda crear cuentas y cambiar contraseñas, `0004_enforce_server_side_auth.sql`.

En el panel de Supabase (configuración que el código no puede comprobar): Site
URL y Redirect URLs deben incluir `https://<dominio>/auth/confirmar`
(confirmación y recuperación); plantillas de correo (con PKCE, el enlace de
recuperación funciona en el mismo navegador; para que funcione en otro, usar la
plantilla con `token_hash`); "Secure password change"; duración del JWT y de las
sesiones; límites de Auth.

## 8. Limitaciones conocidas y mejoras posibles

Lo que el código todavía no hace. Son buenos puntos de partida si quieres
contribuir; abre un issue antes de empezar.

- **Cookie HttpOnly (no implementada).** Hoy leen la sesión desde JavaScript:
  `src/components/layout/UserMenu.tsx` (`onAuthStateChange` y `signOut()` en el
  navegador), `src/lib/energy/store.ts` (`onAuthStateChange` para
  resincronizarse), `LoginForm.tsx` y `RegisterForm.tsx` (`getSession` tras la
  acción), y `src/lib/supabase/client.ts` (renovación automática por defecto). Para
  HttpOnly: que la barra y el almacén reciban el estado desde el servidor (o
  vía route handlers), que el cierre de sesión sea solo la Server Action, que la
  renovación la haga `proxy.ts`, y entonces `httpOnly: true` en
  `hardenAuthCookie`.
- **CSP sin `'unsafe-inline'`**: nonces (obliga a render dinámico de todas las
  páginas) o SRI (experimental en Next 16).
- **Metadatos del alta**: `raw_user_meta_data` conserva `username` y
  `terms_version` (también viajan en el JWT). El código ya no los lee. Limpiarlos
  requiere verificar primero que Supabase Auth no los reescribe; procedimiento
  manual sugerido tras verificarlo:
  `update auth.users set raw_user_meta_data = raw_user_meta_data - 'terms_version';`
- **`activated_on`** repite información de `activated_at` (candidato a retirar).
- **Retención**: no hay una política automática para cuentas inactivas ni para
  el historial de tokens.

## 9. Lo que este código no garantiza

Para no prometer de más, ni en la documentación ni en los textos legales de una
instancia:

- La aceptación de los Términos solo queda registrada si `setup.sql` (que
  incluye `legal.sql`) está aplicado en la base de datos.
- La región donde se guardan los datos, el hosting y los plazos de conservación
  dependen de cada instalación, no del código.
- El hosting y Supabase sí procesan la IP de quien visita la web, aunque
  BytePath no la guarde en claro.
- Lo que Judge0 conserva del código depende del proveedor.
- Eliminar la cuenta no alcanza las copias de seguridad, los logs ni lo ya
  enviado a Judge0 (ver §6).
- Las cookies de sesión no son HttpOnly (ver §8).
- BytePath no verifica la edad: el registro pide confirmar que se tienen 14 años
  o más.
- No hay pagos, publicidad ni Premium de pago activos.
- Este documento no afirma el cumplimiento de ninguna ley concreta.

## 10. Documentos legales

Versiones en el código (`src/lib/legal/documents.ts`): **Términos 1.1** y **Política
de Privacidad 1.0**, ambas con fecha 2026-09-27. Textos: `src/content/legal/terms.tsx`
y `src/content/legal/privacy.tsx`. Las pruebas `tests/legal-documents.test.mjs` y
`tests/rendered-legal.test.mjs` impiden marcadores pendientes, identidades jurídicas
inventadas, promesas de anonimización o de borrado inmediato y plazos que el código
no respalda.

**Antes de desplegar los Términos 1.1** hay que registrar la versión en la base de
datos con `supabase/migrations/0003_publish_terms_1_1.sql` (`setup.sql` solo
siembra la 1.0). El orden completo del despliegue está en `docs/deploy.md`.

Si el código con `TERMS_VERSION = "1.1"` llega antes que esa fila: sin la migración
`0002`, los registros funcionan pero no guardan la aceptación; con `0002` aplicada,
el registro se rechaza; y aceptar los Términos desde `/cuenta` falla
(`not_current_version`). La Política de Privacidad no se acepta y no necesita fila.

**Si despliegas tu propia instancia**, los textos de `src/content/legal/` describen
el BytePath del proyecto y no son asesoría jurídica: adáptalos a tu caso antes de
abrir el registro. Algunos puntos que suelen requerir revisión profesional, según
la normativa de cada país (en Perú, la Ley 29733 y su Reglamento):

- quién figura como responsable del tratamiento de los datos;
- la base jurídica de cada tratamiento, en especial para usuarios menores de edad;
- la edad mínima y cómo se comprueba;
- el registro de los bancos de datos ante la autoridad, si corresponde;
- las transferencias internacionales (Supabase, Judge0 y el hosting pueden tratar
  datos fuera del país);
- la cláusula de limitación de responsabilidad frente a la protección al consumidor.
