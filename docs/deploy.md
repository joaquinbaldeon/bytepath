# BytePath · guía de despliegue en producción (Vercel + Supabase)

> Guía técnica interna. Nada de esto se ha ejecutado contra el proyecto real: es
> la lista para que quien despliega lo haga de forma controlada. Etiquetas:
> **[SQL]** SQL Editor de Supabase · **[SUPABASE DASHBOARD]** panel de Supabase ·
> **[VERCEL ENV]** variables del proyecto en Vercel · **[CODE]** ya está en el código.

## 1. Orden exacto

1. **[SUPABASE DASHBOARD]** Copia de seguridad del proyecto (Database → Backups,
   según el plan) antes de tocar nada.
2. **[SQL]** Si el proyecto no tiene todavía las tablas de BytePath: `supabase/schema.sql`.
3. **[SQL]** `supabase/setup.sql` (aditivo e idempotente; incluye `auth-guard.sql`
   con la exigencia **desactivada**, así que no cambia nada para el código viejo).
4. **[SQL]** `supabase/verify.sql` → todo `OK`; las filas 99 y 105 salen `INFO`
   («desactivada (transición)»).
5. **[SUPABASE DASHBOARD]** Toda la sección 3 de esta guía (URLs, SMTP, correo…).
6. **[VERCEL ENV]** Variables de la sección 4, en el entorno *Production*.
7. **[SQL]** `supabase/migrations/0003_publish_terms_1_1.sql` — **justo antes** del
   despliegue (el código nuevo envía la versión 1.1; si llegara antes que esta
   fila, las altas no guardarían la aceptación).
8. **[VERCEL]** Desplegar. `NEXT_PUBLIC_*` se incrustan al compilar: si cambian,
   hay que volver a desplegar.
9. Comprobar en producción, con las exigencias todavía desactivadas:
   - registro desde el formulario: llega el correo de confirmación y, tras
     confirmarlo, se entra;
   - **[SQL]** `select raw_user_meta_data from auth.users order by created_at desc limit 1;`
     → contiene `username` y `terms_version: "1.1"`, **no** `signup_proof`;
   - **[SQL]** `select document_version from public.legal_acceptances order by accepted_at desc limit 1;` → `1.1`;
   - inicio de sesión, cambio de contraseña desde `/cuenta` (debe decir que se
     cerraron las demás sesiones), un desafío desbloqueado se ejecuta.
10. **[SQL]** `supabase/migrations/0002_require_terms_on_signup.sql` y
    `supabase/migrations/0004_enforce_server_side_auth.sql`.
11. **[SQL]** `supabase/verify.sql` otra vez → 99 y 105 dicen **ACTIVADA**.
12. Prueba de ataque (sección 5). Solo entonces, abrir el registro al público.

Vuelta atrás de 10: `update public.legal_config set require_terms_on_signup = false where id;`
y `update public.auth_guard_config set enforce = false where id;`.

## 2. Qué protege cada pieza nueva

- **Alta** (P-M1): el servidor valida 14+ y Términos, pide a la base de datos una
  firma (`issue_signup_proof`, solo `service_role`, secreto generado dentro de la
  base de datos) y la envía en el alta. El trigger `guard_auth_user_insert`
  rechaza toda alta sin firma válida (15 min, ligada al correo) y **borra** la
  firma de los metadatos. Cierra `POST /auth/v1/signup`, OTP que crea usuarios y
  registro anónimo.
- **Contraseña** (P-M2): tras comprobar la contraseña actual o el enlace de
  recuperación, el servidor emite un permiso de un solo uso y 2 minutos
  (`issue_password_change_ticket`). `guard_auth_user_update` rechaza cualquier
  cambio de `encrypted_password` sin permiso: `PUT /auth/v1/user` con una sesión
  robada ya no sirve.
- **Correo**: cualquier cambio o solicitud de cambio se rechaza (no hay interfaz).
- **Efecto secundario**: con 0004 activa, crear usuarios o cambiar contraseñas o
  correos **desde el panel de Supabase** también se rechaza. Para una operación
  manual: desactivar `auth_guard_config.enforce`, operar, reactivar.
- **Username** (P-B5): ya no se puede cambiar desde el navegador (sin política ni
  privilegio de UPDATE).
- **Límites** (P-M3/P-B3): 30 respuestas de quiz y 60 acciones de progreso por
  minuto y cuenta, sobre la misma tabla `rate_limits`.

## 3. Supabase: configuración del panel

Los nombres exactos del panel cambian entre versiones; donde dice «buscar», es
la sección de Authentication correspondiente.

| # | Dónde | Valor | Por qué / cómo verificar |
|---|---|---|---|
| 1 | Authentication → URL Configuration → **Site URL** | `https://<dominio de producción>` | Destino por defecto de los correos. Verificar: un correo de prueba enlaza a ese dominio. |
| 2 | Authentication → URL Configuration → **Redirect URLs** | `https://<dominio>/auth/confirmar` (y nada de `localhost` en el proyecto de producción) | El código solo pide ese destino. |
| 3 | Authentication → Emails → **SMTP Settings** | **SMTP propio** (proveedor a elegir) | **Bloqueante.** Según la documentación de Supabase, el servicio por defecto es solo para pruebas, solo envía a miembros del equipo del proyecto y a unos 2 correos por hora: sin SMTP propio, los usuarios no reciben la confirmación. El proveedor elegido es un tercero más que recibe correos: añadirlo a la Política de Privacidad. |
| 4 | Email provider → **Confirm email** | Activado | Sin confirmar el correo no hay sesión. Verificar: el registro muestra «Te hemos enviado un correo». |
| 5 | Email provider → **Secure email change** | Activado | Defensa adicional: la base de datos ya rechaza cambios de correo. |
| 6 | Email provider → **Secure password change** | Activado | Pide sesión de menos de 24 h para cambiar la contraseña; el código ya muestra el mensaje «cierra sesión, vuelve a entrar». |
| 7 | Email provider → **Require current password** (si aparece) | **Desactivado** | Rompería «olvidé mi contraseña» (en la recuperación no se conoce la actual). La exigencia la hace BytePath (contraseña actual o enlace reciente) y la base de datos no acepta cambios sin su permiso. |
| 8 | Email provider → **Minimum password length** | 6 como mínimo (el código exige 6); se recomienda subir código y panel a 8 a la vez | Supabase desaconseja menos de 8. Cambiarlo solo en el panel haría que el formulario acepte contraseñas que Supabase rechaza. |
| 9 | Leaked password protection | Opcional (plan Pro o superior) | |
| 10 | Authentication → Sign In / Providers → **Allow new users to sign up** | **Activado** | El alta usa el signUp público; lo que la protege es 0004, no esto. Si se desactiva, BytePath no puede registrar a nadie. |
| 11 | **Anonymous sign-ins** | Desactivado | No se usan (y 0004 los rechazaría igual). |
| 12 | Otros proveedores (Google, GitHub, teléfono, SSO…) | Desactivados | No se usan. |
| 13 | Sessions → JWT expiry | Por defecto (3600 s) o menos | La cookie dura como máximo 30 días; el JWT, lo que diga aquí. |
| 14 | Sessions → Refresh token rotation / reuse | Activada (por defecto) | |
| 15 | Authentication → Rate Limits | Revisar | El servidor de BytePath hace el login y el registro: Supabase ve SU IP. Límites de envío de correo según el SMTP. |
| 16 | Data API → **Exposed schemas** | Solo `public` (y `graphql_public` si aparece) | `auth` y cualquier otro esquema, fuera. |
| 17 | API Keys → clave secreta / service_role | Solo en Vercel, marcada como sensible | Si alguna vez se expuso, rotarla. |
| 18 | Database → Backups | Según el plan; anotar la retención real | Necesario para la Política (hoy dice que no está verificada). |
| 19 | Advisors (Security) | Sin avisos de RLS | Complementa `verify.sql`. |
| 20 | Región del proyecto | Anotarla | Pendiente legal: flujo transfronterizo. |

## 4. Vercel: variables de entorno (Production)

| Variable | Pública/Servidor | Obligatoria | Propósito |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | Sí | URL del proyecto de Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Pública | Sí (o `NEXT_PUBLIC_SUPABASE_ANON_KEY` en proyectos antiguos) | Clave publicable; la seguridad la dan RLS y los triggers. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Servidor** | **Sí** (o `SUPABASE_SECRET_KEY`) | Progreso, límites, eliminación de cuentas, prueba de alta y permiso de contraseña. Con 0004, sin ella no hay altas ni cambios de contraseña. Marcar como *Sensitive*. |
| `SITE_URL` | Servidor | **Sí** | `https://<dominio>`, sin barra final. Correos, redirecciones y cookies `Secure`. En producción no se toma el origen de ninguna cabecera. |
| `JUDGE0_URL` | Servidor | Sí, para los desafíos | Sin ella, las ejecuciones responden «no disponible». |
| `JUDGE0_API_KEY` | Servidor | Según el proveedor | Instancia propia (`X-Auth-Token`) o RapidAPI. *Sensitive*. |
| `JUDGE0_API_HOST` | Servidor | Solo RapidAPI | |
| `JUDGE0_LANGUAGE_ID` | Servidor | No | Fija el id de C++ en vez de detectarlo. |
| `TRUSTED_IP_HEADER` | Servidor | Recomendada: `x-real-ip` | Según la documentación de Vercel, `X-Forwarded-For` lo sobrescribe Vercel para impedir la falsificación y `x-real-ip` es idéntica. Sin ella no hay límites por conexión (registro, recuperación, login fallido). |
| `TRUSTED_PROXY_COUNT` | Servidor | No | Solo con `x-forwarded-for`; no hace falta con `x-real-ip`. |
| `HMAC_SECRET` | Servidor | Recomendada | Clave del identificador de IP (≥ 32 caracteres, `openssl rand -base64 48`). Sin ella se usa la clave de servicio. *Sensitive*. |

Ningún secreto con prefijo `NEXT_PUBLIC_`. Los despliegues *Preview* comparten
dominio `*.vercel.app` y, si usan el mismo Supabase, pueden crear cuentas reales:
usar otro proyecto de Supabase para Preview o activar la protección de despliegues.

## 5. Prueba de ataque tras 0004 (desde cualquier terminal)

Con la URL y la clave **publicable** (las del navegador, no la secreta):

```bash
curl -s -X POST "$SUPABASE_URL/auth/v1/signup" -H "apikey: $PUBLISHABLE_KEY" -H "Content-Type: application/json" -d '{"email":"prueba-directa@example.com","password":"prueba-12345","data":{"username":"prueba_directa","terms_version":"1.1"}}'
```

Debe responder un error («Database error saving new user») y **no** debe aparecer
la cuenta en Authentication → Users.

## 6. Judge0: decisión pendiente

Hoy `JUDGE0_URL` apunta a `https://ce.judge0.com`, la instancia pública, sin clave.
Su retención y sus condiciones de uso **no están verificadas**. Lo que el código
ya admite sin cambios: instancia propia (`JUDGE0_URL` + `JUDGE0_API_KEY` como
`X-Auth-Token`) o Judge0 en RapidAPI (`JUDGE0_API_KEY` + `JUDGE0_API_HOST`).

- **A. Mantener la pública**: sin coste ni mantenimiento; sin contrato, sin
  retención conocida, sin garantía de disponibilidad ni de cupo, y el código de
  los usuarios va a un tercero cuyas condiciones no se han revisado.
- **B. Judge0 gestionado (p. ej. RapidAPI)**: cupos y condiciones contractuales
  conocidas; coste; sigue siendo un tercero.
- **C. Instancia propia**: control de la retención y de la ubicación de los datos;
  requiere servidor, mantenimiento y aislamiento (ejecuta código ajeno).

La elección depende de las condiciones del proveedor, el presupuesto y la
ubicación de los datos, que no se han verificado aquí.
