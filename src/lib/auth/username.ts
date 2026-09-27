/**
 * Reglas del username, compartidas por el formulario, la Server Action y la
 * base de datos.
 *
 * El patrón de aquí y el CHECK de `supabase/schema.sql` tienen que decir lo
 * mismo: si divergen, el formulario aceptaría algo que la base de datos
 * rechazaría después con un error feo. Al tocar uno, toca el otro.
 *
 * No se usa el username como identificador interno: es solo el nombre público.
 * La identidad es el UUID de `auth.users`, así que cambiarlo más adelante no
 * afecta a ningún dato relacionado.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Letras sin acentos, números y guion bajo. */
export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

/**
 * El mismo patrón para el atributo `pattern` de un input, que no admite
 * anclas. Sale de aquí para que el formulario no pueda divergir de la regla.
 */
export const USERNAME_HTML_PATTERN = "[A-Za-z0-9_]+";

export const USERNAME_RULES_HINT =
  "Entre 3 y 20 caracteres: letras, números y guion bajo.";

/** Devuelve el mensaje de error, o null si el username es válido. */
export function validateUsername(raw: string): string | null {
  const username = raw.trim();

  if (username.length === 0) return "Elige un nombre de usuario.";
  if (username.length < USERNAME_MIN_LENGTH) {
    return `Debe tener al menos ${USERNAME_MIN_LENGTH} caracteres.`;
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return `No puede pasar de ${USERNAME_MAX_LENGTH} caracteres.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Solo puede llevar letras, números y guion bajo.";
  }
  return null;
}
