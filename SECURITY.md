# Política de seguridad

BytePath maneja cuentas de estudiantes, algunos menores de edad, así que nos tomamos en serio los problemas de seguridad. Gracias por ayudarnos a encontrarlos.

## Qué versión se mantiene

Solo la rama `main`. No hay versiones antiguas con soporte.

## Cómo reportar una vulnerabilidad

**No abras un issue público** ni publiques los detalles hasta que esté resuelto.

1. Usa el reporte privado de GitHub: en este repositorio, ve a la pestaña **Security** → **Report a vulnerability**. Solo lo ven los mantenedores.
2. Si esa opción no aparece, escribe a **bytepath.learning.contact@gmail.com**. Esa es la dirección de contacto que publica BytePath en sus documentos legales. Cuenta lo mínimo y te responderemos para acordar cómo compartir los detalles.

Incluye, si puedes:

- qué parte afecta (ruta, función, archivo SQL…);
- cómo reproducirlo, paso a paso;
- qué podría hacer alguien con ello.

## Qué puedes esperar

Somos un equipo de estudiantes, sin guardia permanente:

- intentaremos confirmar que recibimos el reporte en unos días;
- te contaremos si lo podemos reproducir y cómo vamos a corregirlo;
- si quieres, te daremos el crédito cuando lo publiquemos.

## Pruebas responsables

- Prueba contra **tu propia instalación** de BytePath (ver [docs/SETUP.md](docs/SETUP.md)), no contra la de producción.
- No accedas a datos de otros usuarios, no los modifiques y no los conserves.
- No hagas pruebas de denegación de servicio ni de envío masivo.

Lo que BytePath protege y cómo está en [docs/security-privacy.md](docs/security-privacy.md).
