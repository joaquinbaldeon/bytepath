# BytePath

**Aprende. Practica. Compite.**

BytePath es una plataforma educativa en español para aprender programación competitiva con C++. Va desde tu primera línea de código hasta tus primeros problemas de concurso, pensando en estudiantes que se preparan para olimpiadas como la OPI (Olimpiada Peruana de Informática).

Lecciones cortas, quizzes y desafíos de código que se corrigen en el servidor con casos de prueba ocultos, como en un juez de verdad.

> **Estado:** en desarrollo activo, hecho por un equipo de estudiantes. Hay partes que todavía no existen (ver [Estado y roadmap](#estado-y-roadmap)).

## Qué tiene hoy

- **Dos cursos**:
  - *C++ Fundamentos*: 8 módulos y 29 lecciones, completo.
  - *Introducción a la Programación Competitiva*: 7 lecciones, de las que la primera tiene contenido y el resto está en preparación.
- **Lecciones** con teoría, ejemplos de código con resaltado, trazas paso a paso y avisos.
- **Quizzes** corregidos en el servidor: las respuestas correctas no viajan al navegador.
- **Desafíos de C++** con editor (CodeMirror). El código se compila y ejecuta en [Judge0](https://judge0.com/) desde el servidor y se compara con casos de prueba guardados en el servidor; de los casos ocultos, el navegador solo sabe si pasaron.
- **Camino de aprendizaje** visual, con lecciones que se desbloquean en orden y progreso guardado.
- **Cuentas** con Supabase Auth:
  - registro con confirmación por correo y aceptación de Términos;
  - recuperación y cambio de contraseña;
  - exportar tus datos y eliminar tu cuenta.
- **Energía y tokens**. Completar una lección gasta energía y da tokens; la energía se regenera con el tiempo.
- **Tema claro y oscuro**, diseño adaptable a móvil.
- **Términos y Política de Privacidad** versionados dentro del proyecto.

Las secciones *Problemas* y *Competición* aparecen en el menú como «Pronto»: todavía no existen.

> No hay capturas de pantalla en el repositorio todavía. Si contribuyes una, añádela a `docs/` y enlázala aquí.

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| [Next.js](https://nextjs.org/) (App Router) | 16.3 | Páginas, Server Components, Server Actions y la ruta `/api/runs` |
| React | 19.2 | Interfaz |
| TypeScript | 5 | Todo el código |
| Tailwind CSS | 4 | Estilos |
| Framer Motion | 13 | Animaciones |
| CodeMirror 6 | — | Editor de código de los desafíos |
| [Supabase](https://supabase.com/) | supabase-js 2 | Cuentas (Auth) y base de datos Postgres con RLS |
| [Judge0](https://judge0.com/) | CE | Compilar y ejecutar C++ |

## Arquitectura

```text
Navegador
  │  páginas React (Server + Client Components)
  ▼
Next.js (servidor)
  ├─ Contenido de los cursos ─────── src/content/  (TypeScript dentro del repo, no en la base de datos)
  ├─ Server Actions ─ quiz, progreso, cuenta, registro
  ├─ POST /api/runs ─ comprueba sesión, desbloqueo y cupos
  │                       │
  │                       ▼
  │                    Judge0 ─ compila y ejecuta C++ (solo recibe código y entradas)
  │
  ▼
Supabase
  ├─ Auth ─ cuentas, sesión en cookies
  └─ Postgres
       ├─ RLS: cada usuario solo LEE sus propias filas
       └─ funciones SQL ─ todo lo que ESCRIBE progreso, energía o tokens
                          solo lo puede ejecutar el servidor (clave service_role)
```

Las ideas importantes para colaborar:

- **El navegador no decide nada.** Corregir un quiz, dar por superado un desafío, gastar energía o dar tokens lo hace el servidor. La base de datos lo vuelve a comprobar en funciones SQL que solo puede ejecutar la clave secreta.
- **El contenido vive en el código.** Las lecciones, quizzes y desafíos son archivos TypeScript en `src/content/courses/`. Los casos de prueba de los desafíos están en `src/server/challenges/`, que solo se carga en el servidor.
- **Todo funciona por partes.** Sin Supabase, BytePath abre los cursos sin cuentas. Sin Judge0, los desafíos dicen que la ejecución no está disponible, en vez de simular un resultado.

Más detalle de seguridad y datos: [`docs/security-privacy.md`](docs/security-privacy.md).

## Empezar en local

Requisitos: **Node.js 22.18 o superior** (probado con Node 24) y npm.

```bash
git clone https://github.com/joaquinbaldeon/bytepath.git
cd bytepath
npm install
cp .env.example .env.local   # en Windows (cmd): copy .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Sin configurar nada más ya puedes recorrer los cursos y leer las lecciones.

Para tener **cuentas, progreso guardado y ejecución real de C++** necesitas tu propio proyecto de Supabase y un Judge0. Los pasos están en **[docs/SETUP.md](docs/SETUP.md)**.

### Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Ninguna es obligatoria para arrancar.

| Variable | Dónde se usa | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | navegador + servidor | URL de tu proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | navegador + servidor | Clave publicable; el acceso real lo deciden las políticas RLS |
| `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SECRET_KEY`) | **solo servidor, secreta** | Guardar progreso, energía y tokens; registro y cuenta |
| `SITE_URL` | solo servidor | Dirección pública (enlaces de correo, cookies `Secure`) |
| `JUDGE0_URL`, `JUDGE0_API_KEY`, `JUDGE0_API_HOST`, `JUDGE0_LANGUAGE_ID` | solo servidor | Ejecución de C++ |
| `JUDGE0_DAILY_RUN_LIMIT` | solo servidor | Tope global de ejecuciones al día (control de costes) |
| `TRUSTED_IP_HEADER`, `TRUSTED_PROXY_COUNT` | solo servidor | Límites por IP detrás de un proxy de confianza |
| `HMAC_SECRET` | solo servidor, secreta | Identificador de IP para los límites |
| `BYTEPATH_BASE_URL` | solo pruebas | Pruebas contra una instancia en marcha |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en <http://localhost:3000> |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas con el test runner de Node (`tests/*.test.mjs`) |
| `npm run db:bundle` | Regenera `supabase/setup.sql` a partir de los archivos SQL |

Las reglas de la base de datos tienen sus propias pruebas en SQL (`supabase/*-tests.sql`). Se ejecutan en el SQL Editor de Supabase y terminan en `ROLLBACK`; ver [docs/SETUP.md](docs/SETUP.md#pruebas-de-la-base-de-datos).

## Estructura

```text
src/
  app/              rutas de Next.js (páginas, /api/runs, /api/cuenta, /auth/confirmar)
  components/       componentes de interfaz, por área (courses, auth, energy, layout, ui...)
  content/
    courses/        el contenido de los cursos: lecciones, quizzes, desafíos
    legal/          Términos y Política de Privacidad
  lib/              lógica compartida (cursos, auth, energía, tokens, ejecución, Supabase)
  server/           solo servidor: casos de prueba de los desafíos
supabase/           esquema, funciones, migraciones y pruebas SQL
scripts/            utilidades (generar setup.sql)
tests/              pruebas de Node
docs/               guía de setup, despliegue y seguridad
```

## Contribuir

¡Las contribuciones son bienvenidas! Lee [CONTRIBUTING.md](CONTRIBUTING.md) y el [Código de Conducta](CODE_OF_CONDUCT.md). Para reportar una vulnerabilidad, **no abras un issue público**: sigue [SECURITY.md](SECURITY.md).

## Estado y roadmap

BytePath sigue en desarrollo y la dirección puede cambiar. Estas son ideas en las que queremos trabajar, sin fechas comprometidas:

- [ ] Completar las lecciones de *Introducción a la Programación Competitiva*.
- [ ] Banco de problemas propio (sección *Problemas*).
- [ ] Competición: duelos, rangos y tablas por clase (sección *Competición*).
- [ ] Herramientas para docentes: clases y progreso de los alumnos.
- [ ] Más pruebas automáticas.

Si quieres ayudar en algo de esto, abre un issue para conversarlo antes de empezar.

## Licencia

El repositorio tiene tres tipos de material, con condiciones distintas:

| Material | Dónde | Licencia |
|---|---|---|
| **Código fuente** | `src/` (salvo `src/content/`), `supabase/`, `scripts/`, `tests/`, configuración | [MIT](LICENSE) © BytePath contributors |
| **Contenido educativo y textos legales** | `src/content/courses/` (lecciones, quizzes, enunciados y explicaciones), los casos de prueba de `src/server/challenges/` y `src/content/legal/` | **Todavía sin licencia definida.** La licencia MIT no se aplica a este contenido. Sus derechos corresponden a sus autores; si quieres reutilizarlo fuera de este repositorio, abre un issue y pregunta antes |
| **Dependencias de terceros** | `package.json` (se instalan en `node_modules/`, que no forma parte del repositorio) y las fuentes tipográficas que descarga `next/font` | Cada una con su propia licencia |

El nombre y el logo de BytePath no forman parte de la licencia MIT.
