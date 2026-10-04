# Cómo contribuir a BytePath

¡Gracias por querer ayudar! BytePath es un proyecto de estudiantes y está en desarrollo, así que toda ayuda cuenta: corregir una errata en una lección, mejorar un ejercicio, arreglar un bug o proponer una idea.

## Antes de empezar

- Lee el [Código de Conducta](CODE_OF_CONDUCT.md).
- Para algo grande (una sección nueva, un cambio en la energía o los tokens, un rediseño), **abre primero un issue** y conversémoslo. Así no trabajas en algo que luego no encaja.
- Para erratas y arreglos pequeños, puedes mandar el Pull Request directamente.
- ¿Encontraste un problema de seguridad? **No abras un issue público**: sigue [SECURITY.md](SECURITY.md).

## Paso a paso

1. **Haz un fork** del repositorio en GitHub y clónalo:

   ```bash
   git clone https://github.com/<tu-usuario>/bytepath.git
   cd bytepath
   npm install
   ```

2. **Prepara tu entorno.** Sigue [docs/SETUP.md](docs/SETUP.md). Para muchos cambios, como textos, lecciones o interfaz, no necesitas Supabase ni Judge0.

3. **Crea una rama** con un nombre que diga qué haces:

   ```bash
   git checkout -b fix/errata-modulo-3
   git checkout -b feat/nuevo-ejercicio-bucles
   ```

4. **Haz tus cambios.** Intenta que cada Pull Request haga una sola cosa.

5. **Pruébalo:**

   ```bash
   npm run lint
   npm run build
   npm test
   ```

   Los tres deben pasar. Si tocaste algo visible, ábrelo en el navegador con `npm run dev` y revísalo también en un ancho de móvil.

6. **Haz commit** con un mensaje claro que diga qué cambia:

   ```bash
   git commit -m "Corrige la explicación de los bucles while"
   ```

7. **Sube tu rama y abre un Pull Request** contra `main`, rellenando la plantilla: qué cambia, por qué y cómo lo probaste.

## Qué esperamos de una contribución

- **Que funcione:** lint, pruebas y build en verde.
- **Que se parezca al código que la rodea:** mismo estilo, nombres y forma de comentar. No hace falta reescribir lo que ya funciona.
- **Español claro** en todo lo que ve el estudiante.
- **Sin secretos:** nunca subas `.env.local`, claves ni datos de usuarios reales.
- **Las reglas importantes se quedan en el servidor.** Corregir un quiz, dar por superado un desafío, gastar energía o dar tokens no se decide en el navegador. Si tu cambio toca eso, explica en el PR cómo lo mantiene.
- **Si cambias SQL**, edita el archivo de origen en `supabase/`, regenera `setup.sql` con `npm run db:bundle` y di en el PR qué probaste.

## Contenido educativo

Las lecciones viven en `src/content/courses/`.

- Escribe con tus palabras. No copies textos, problemas ni soluciones de otras plataformas o libros. Si te inspiraste en una fuente, dilo en el PR.
- Un ejercicio nuevo necesita casos de prueba en `src/server/challenges/tests.ts`, y una solución tuya que pase todos.
- **Licencias:** las contribuciones de código se publican bajo la [licencia MIT](LICENSE). El contenido educativo todavía no tiene una licencia definida (ver la sección *Licencia* del README). Si quieres aportar lecciones o ejercicios, coméntalo primero en un issue y lo acordamos.

## Revisión

Un mantenedor revisará tu PR. Puede que pidamos cambios: es parte normal del proceso, no un rechazo. Como somos estudiantes, a veces tardamos unos días en responder. ¡Gracias por la paciencia!
