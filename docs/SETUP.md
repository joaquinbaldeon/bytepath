# Levantar BytePath en local

Esta guía es para quien clona el repositorio y quiere tener BytePath funcionando en su máquina con **sus propios** servicios. Nada de aquí apunta al BytePath de producción.

Hay tres niveles. Llega hasta donde necesites:

| Nivel | Qué funciona | Qué necesitas |
|---|---|---|
| 1. Solo Next.js | Cursos, lecciones y quizzes de lectura; sin cuentas | Node.js |
| 2. + Supabase | Cuentas, progreso guardado, energía y tokens | Un proyecto de Supabase (el plan gratuito sirve) |
| 3. + Judge0 | Ejecutar y corregir los desafíos de C++ | Una instancia de Judge0 |

## Requisitos

- **Node.js 22.18 o superior** (probado con 24). Se necesita por dos razones: `@supabase/supabase-js` pide Node 22 o superior, y `npm test` importa archivos `.ts` directamente, algo que Node hace sin opciones desde la 22.18.
- **npm** (viene con Node). El repositorio usa `package-lock.json`.
- Opcional: una cuenta en [Supabase](https://supabase.com/).
- Opcional: acceso a [Judge0](https://judge0.com/) (hospedado o propio).

## 1. Instalar y arrancar

```bash
git clone https://github.com/joaquinbaldeon/bytepath.git
cd bytepath
npm install
cp .env.example .env.local   # en Windows (cmd): copy .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Con `.env.local` sin rellenar, BytePath funciona sin cuentas: puedes recorrer los cursos y leer las lecciones.

> Next.js lee `.env.local` al arrancar. Cada vez que cambies una variable, **reinicia** `npm run dev`.

## 2. Supabase

### 2.1 Crear el proyecto y copiar las claves

1. Crea un proyecto nuevo en Supabase.
2. En **Project Settings → API Keys**, copia:
   - la **URL del proyecto** → `NEXT_PUBLIC_SUPABASE_URL`;
   - la **clave publicable** (o *anon key*) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`);
   - la **clave secreta** (*secret* / *service_role*) → `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SECRET_KEY`).
3. Añade también `SITE_URL=http://localhost:3000`. Sin ella, los enlaces de los correos de confirmación no vuelven a tu BytePath local.

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publicable
SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta
SITE_URL=http://localhost:3000
```

La clave secreta da acceso total a tu base de datos: va **solo** en `.env.local` (que Git ignora) y nunca en una variable que empiece por `NEXT_PUBLIC_`.

Sin la clave secreta las cuentas funcionan, pero el progreso, la energía y los tokens no se guardan, y no se puede eliminar la cuenta. La aplicación avisa de ello en lugar de fingir que guardó.

### 2.2 Crear las tablas y funciones

En el **SQL Editor** de Supabase, pega y ejecuta **cada archivo entero**, en este orden:

| # | Archivo | Qué hace |
|---|---|---|
| 1 | `supabase/schema.sql` | Perfiles de usuario y sus políticas RLS |
| 2 | `supabase/setup.sql` | Seguridad, energía, tokens, progreso, documentos legales y la protección de altas (con la exigencia **desactivada**) |
| 3 | `supabase/migrations/0003_publish_terms_1_1.sql` | Publica la versión 1.1 de los Términos, la que envía el código al registrarse |
| 4 | `supabase/verify.sql` | **Solo lectura.** Comprueba que todo quedó bien: todas las filas deben decir `OK` (algunas pueden decir `INFO`) |

Los archivos son idempotentes: ejecutarlos dos veces no rompe nada.

`setup.sql` se genera a partir de `security.sql`, `energy.sql`, `economy.sql`, `progress.sql`, `legal.sql` y `auth-guard.sql`. Si cambias alguno de ellos, regenéralo con `npm run db:bundle`. No edites `setup.sql` a mano.

**Migraciones de endurecimiento (para producción, no hacen falta en local):**

- `0002_require_terms_on_signup.sql`: rechaza altas sin aceptación de los Términos.
- `0004_enforce_server_side_auth.sql`: solo el servidor de BytePath puede crear cuentas o cambiar contraseñas (necesita la clave secreta).

Tienen un orden y unas condiciones precisas. Lee su cabecera y [`docs/deploy.md`](deploy.md) antes de aplicarlas.

### 2.3 Configurar Auth

En **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/confirmar`

En **Authentication → Sign In / Providers → Email**, deja activada la confirmación de correo.

> **Correos en desarrollo:** el servicio de correo por defecto de Supabase es solo para pruebas. Según su documentación, solo envía a miembros del equipo de tu proyecto y muy pocos correos por hora. Para probar el registro, usa un correo que sea miembro de tu proyecto de Supabase, o configura tu propio SMTP en **Authentication → Emails**.

Reinicia `npm run dev` y prueba a registrarte.

> El plan gratuito de Supabase **pausa el proyecto** tras unos días sin actividad. Si BytePath deja de conectar de repente, revisa en el panel si está pausado.

### Pruebas de la base de datos

Los archivos `supabase/*-tests.sql` prueban las reglas de la base de datos: energía, tokens, progreso, documentos legales y seguridad.

- Se ejecutan en el SQL Editor, después de los pasos de 2.2.
- Todo ocurre dentro de una transacción que termina en `ROLLBACK`, así que no dejan rastro.
- Algunas usan la primera cuenta que exista en `auth.users`, así que conviene haberse registrado una vez.
- Cada archivo explica en su cabecera qué necesita.
- Al final imprimen una tabla, y todas las filas deben decir `OK`.

## 3. Judge0 (ejecutar C++)

BytePath manda a Judge0 **solo** el código, las entradas de prueba, el lenguaje y los límites de tiempo y memoria. No manda usuario, correo ni curso.

### Opción A: Judge0 hospedado en RapidAPI

```env
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=tu-clave-de-rapidapi
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

El plan gratuito tiene una cuota diaria pequeña: sirve para desarrollar, no para una clase entera. Cada ejecución de un desafío manda un envío **por cada caso de prueba**.

### Opción B: tu propia instancia de Judge0

```env
JUDGE0_URL=https://tu-instancia-de-judge0
JUDGE0_API_KEY=tu-token        # opcional; se envía como X-Auth-Token
```

No definas `JUDGE0_API_HOST` en este caso. Para instalar Judge0, sigue su [repositorio oficial](https://github.com/judge0/judge0). Dos avisos:

- **Usa la versión 1.13.1 o posterior.** Las anteriores tienen vulnerabilidades que permiten escapar del sandbox.
- Ejecuta código de desconocidos: aíslala bien y no la pongas en el mismo servidor que tus secretos.

### Opcionales

- `JUDGE0_LANGUAGE_ID`: fija el identificador del lenguaje C++. Si no lo pones, BytePath lo detecta.
- `JUDGE0_DAILY_RUN_LIMIT`: tope global de ejecuciones en 24 horas, para no gastar de más si pagas por uso. Necesita la clave secreta de Supabase y `setup.sql` aplicado.

Sin `JUDGE0_URL`, los desafíos responden que la ejecución no está disponible. Nunca simulan un resultado correcto.

## 4. Comprobar que todo funciona

```bash
npm run lint
npm run build
npm test
```

El orden importa: una de las pruebas revisa que el JavaScript que llega al navegador (`.next/static`) no contenga respuestas ni soluciones, y se omite si todavía no compilaste. Otras 3 pruebas necesitan una instancia en marcha y se omiten si no la tienes. Para ejecutarlas, arranca BytePath y define `BYTEPATH_BASE_URL`:

```bash
BYTEPATH_BASE_URL=http://localhost:3000 npm test
```

En PowerShell: `$env:BYTEPATH_BASE_URL="http://localhost:3000"; npm test`.

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| Al registrarte o entrar: «El servicio de cuentas no está disponible ahora mismo» | Faltan `NEXT_PUBLIC_SUPABASE_URL` o la clave publicable, o no reiniciaste `npm run dev` |
| Te registras pero no llega el correo | Límite del correo por defecto de Supabase (ver 2.3) |
| El progreso no se guarda | Falta `SUPABASE_SERVICE_ROLE_KEY`, o `setup.sql` no está aplicado: ejecuta `verify.sql` |
| Los desafíos dicen que la ejecución no está disponible | Falta `JUDGE0_URL`, o la cuota de Judge0 se agotó |
| El registro se rechaza tras aplicar 0004 | Falta la clave secreta en el servidor (ver la cabecera de la migración) |

## Producción

Desplegar en producción tiene pasos adicionales: SMTP propio, migraciones de endurecimiento, cabeceras de IP y variables en el hosting. Están en [`docs/deploy.md`](deploy.md) y [`docs/security-privacy.md`](security-privacy.md).
