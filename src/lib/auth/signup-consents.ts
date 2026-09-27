/**
 * Las dos casillas obligatorias del registro, independientes entre sí:
 *
 *   · «Confirmo que tengo 14 años o más.»  Es una condición del registro de
 *     BytePath tal como funciona hoy, no una edad mínima fijada por ley (ver la
 *     sección 19 de los Términos). Solo se pide la confirmación: nada de fecha
 *     de nacimiento ni edad exacta. Y la confirmación NO se guarda en ningún
 *     sitio: se comprueba en el servidor y se descarta. Ni `signUp` ni los
 *     metadatos de la cuenta la reciben.
 *   · La aceptación de los Términos y Condiciones.
 *
 * El formulario no deja enviar sin marcar las dos, pero una Server Action es un
 * endpoint público: `signUpAction` las vuelve a exigir con `checkSignUpConsents`
 * antes de llamar a Supabase.
 *
 * Sin imports a propósito: las pruebas (`npm test`) cargan este archivo con
 * Node directamente.
 */

export const AGE_CONFIRMATION_FIELD = "confirmAge";
export const TERMS_ACCEPTANCE_FIELD = "acceptTerms";

export const SIGNUP_CONSENT_ERRORS = {
  age: "Para crear la cuenta tienes que confirmar que tienes 14 años o más.",
  terms: "Para crear la cuenta tienes que aceptar los Términos y Condiciones.",
} as const;

/** Lo único que se usa de `FormData`: así las pruebas pueden pasar cualquier objeto con `get`. */
type FormFields = { get(name: string): unknown };

/**
 * Una casilla marcada llega como el texto "on" (el valor por defecto de un
 * checkbox sin `value`). Cualquier otra cosa —ausente, vacía, "true", "1", un
 * archivo— cuenta como NO marcada.
 */
function isChecked(form: FormFields, field: string): boolean {
  return form.get(field) === "on";
}

/** Devuelve el mensaje de error, o `null` si las dos casillas están marcadas. */
export function checkSignUpConsents(form: FormFields): string | null {
  if (!isChecked(form, AGE_CONFIRMATION_FIELD)) return SIGNUP_CONSENT_ERRORS.age;
  if (!isChecked(form, TERMS_ACCEPTANCE_FIELD)) return SIGNUP_CONSENT_ERRORS.terms;
  return null;
}
