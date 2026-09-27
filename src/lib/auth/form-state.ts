/**
 * Estado que devuelven los formularios de cuenta.
 *
 * Vive fuera de `actions.ts` por una restricción de Next: un archivo marcado
 * con "use server" solo puede exportar funciones asíncronas, así que el valor
 * inicial no puede estar ahí.
 *
 * Los tres campos son excluyentes entre sí: cada respuesta llena uno.
 *   · error    algo ha fallado y hay que corregirlo
 *   · notice   no hay error, pero la cuenta todavía no está operativa
 *              (por ejemplo, falta confirmar el correo)
 *   · success  la operación ha salido bien; el formulario lo confirma y el
 *              cliente se encarga de navegar
 */

export type AuthFormState = {
  error: string | null;
  notice: string | null;
  success: string | null;
};

export const emptyAuthState: AuthFormState = {
  error: null,
  notice: null,
  success: null,
};
