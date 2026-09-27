"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { hasRecentLinkAuthentication, verifyPassword } from "@/lib/auth/reauth";
import { getCurrentUser } from "@/lib/auth/session";
import { TERMS_VERSION } from "@/lib/legal/documents";
import { failureLimiter, REAUTH_FAILURE_LIMIT } from "@/lib/security/rateLimit";
import { routes } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Gestión de la propia cuenta: contraseña, eliminación y aceptación de los
 * Términos vigentes.
 *
 * En todas, el usuario sale de la cookie de sesión validada por Supabase
 * (`getCurrentUser`). Ninguna acepta un id de usuario del formulario: no hay
 * forma de actuar sobre otra cuenta.
 */

const MIN_PASSWORD_LENGTH = 6;

function fail(error: string): AuthFormState {
  return { error, notice: null, success: null };
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

/* ---------------------------- Cambiar contraseña --------------------------- */

/**
 * Cambia la contraseña. Pide la actual, salvo que la sesión se haya abierto
 * hace menos de 15 minutos con el enlace de recuperación (ver
 * `hasRecentLinkAuthentication`): ese es el camino de "olvidé mi contraseña".
 */
export async function updatePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail("El servicio de cuentas no está disponible ahora mismo.");

  const user = await getCurrentUser();
  if (!user || !user.email) return fail("Tu sesión ha caducado. Vuelve a iniciar sesión.");

  const current = readText(formData, "currentPassword");
  const password = readText(formData, "password");
  const confirm = readText(formData, "passwordConfirm");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(`La contraseña nueva debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (password !== confirm) return fail("Las dos contraseñas nuevas no coinciden.");

  const viaRecoveryLink = await hasRecentLinkAuthentication();
  if (!viaRecoveryLink) {
    if (!current) return fail("Escribe tu contraseña actual.");
    const reauth = await checkCurrentPassword(user.id, user.email, current);
    if (reauth) return fail(reauth);
  }

  // La base de datos solo acepta el cambio con un permiso de 2 minutos que
  // emite el servidor aquí, DESPUÉS de las comprobaciones de arriba
  // (supabase/auth-guard.sql). Así, cambiar la contraseña llamando
  // directamente a Supabase con una sesión robada se rechaza.
  await issuePasswordChangeTicket(user.id);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const code = error.code ?? "";
    if (code === "same_password") return fail("La contraseña nueva debe ser distinta de la actual.");
    if (code === "weak_password") return fail("Esa contraseña es demasiado débil. Prueba con una más larga.");
    if (code === "reauthentication_needed") {
      return fail("Por seguridad, cierra sesión, vuelve a entrar y repite el cambio.");
    }
    console.error("[account] updateUser(password) ha fallado", { code: code || null, status: error.status ?? null });
    return fail("No se ha podido cambiar la contraseña. Inténtalo de nuevo.");
  }

  // Cerrar TODAS las demás sesiones de la cuenta (otros navegadores y
  // dispositivos), conservando esta. BytePath no da por hecho que Supabase lo
  // haga al cambiar la contraseña: lo pide explícitamente. Va DESPUÉS del
  // cambio, así que la sesión con la que se está cambiando nunca se cierra antes
  // de terminar. Si falla, la contraseña ya está cambiada y se dice.
  const { error: revokeError } = await supabase.auth.signOut({ scope: "others" });
  if (revokeError) {
    console.error("[account] signOut(others) tras cambiar la contraseña ha fallado", {
      code: revokeError.code ?? null,
      status: revokeError.status ?? null,
    });
  }

  redirect(`${routes.account}?contrasena=actualizada&sesiones=${revokeError ? "abiertas" : "cerradas"}`);
}

/**
 * Emite el permiso de cambio de contraseña. Si no se puede (sin clave de
 * servicio o sin auth-guard.sql), no se inventa: decide la base de datos. Con
 * la exigencia activada, el cambio se rechazará; sin ella, sigue funcionando.
 */
async function issuePasswordChangeTicket(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[account] Sin SUPABASE_SERVICE_ROLE_KEY no se puede emitir el permiso de cambio de contraseña.");
    return;
  }
  const { error } = await admin.rpc("issue_password_change_ticket", { p_user: userId });
  if (error) logSupabaseFailure("account", "issue_password_change_ticket", describeSupabaseError(error));
}

/**
 * Comprueba la contraseña actual con un límite de intentos FALLIDOS por usuario
 * (5 cada 15 min): con una sesión robada no se puede probar contraseñas sin
 * fin. Devuelve el mensaje de error, o `null` si es correcta.
 */
async function checkCurrentPassword(userId: string, email: string, password: string): Promise<string | null> {
  const failures = await failureLimiter(REAUTH_FAILURE_LIMIT, userId);
  if (await failures.blocked()) {
    return "Demasiados intentos con una contraseña incorrecta. Espera unos minutos y vuelve a probar.";
  }
  if (await verifyPassword(email, password)) return null;
  await failures.fail();
  return "La contraseña actual no es correcta.";
}

/* ----------------------------- Eliminar cuenta ----------------------------- */

const DELETE_CONFIRMATION = "ELIMINAR";

/** Tablas de BytePath con datos del usuario (todas con borrado en cascada). */
const USER_TABLES = [
  ["profiles", "id"],
  ["subscriptions", "user_id"],
  ["user_energy", "user_id"],
  ["lesson_activations", "user_id"],
  ["user_tokens", "user_id"],
  ["token_transactions", "user_id"],
  ["legal_acceptances", "user_id"],
  ["rate_limits", "user_id"],
] as const;

/**
 * Elimina la cuenta del usuario que tiene la sesión abierta.
 *
 *   1. Exige escribir ELIMINAR y la contraseña actual.
 *   2. Borra el usuario en Supabase Auth con la clave de servicio. Todas las
 *      tablas de BytePath referencian `auth.users` con ON DELETE CASCADE, así
 *      que el perfil, el progreso, la energía, los tokens y su historial, las
 *      aceptaciones y los contadores de límite se borran en la misma operación.
 *   3. Comprueba que no queda ninguna fila suya en esas tablas.
 *   4. Borra las cookies de sesión y lleva al login.
 *
 * Lo que esto NO borra (fuera del alcance de BytePath): copias de seguridad de
 * Supabase, registros técnicos del hosting y de Supabase, y lo enviado a Judge0.
 * Ver docs/security-privacy.md.
 */
export async function deleteAccountAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail("El servicio de cuentas no está disponible ahora mismo.");

  const user = await getCurrentUser();
  if (!user || !user.email) return fail("Tu sesión ha caducado. Vuelve a iniciar sesión.");

  if (readText(formData, "confirmation").trim() !== DELETE_CONFIRMATION) {
    return fail(`Escribe ${DELETE_CONFIRMATION} para confirmar.`);
  }
  const reauth = await checkCurrentPassword(user.id, user.email, readText(formData, "password"));
  if (reauth) return fail(reauth === "La contraseña actual no es correcta." ? "La contraseña no es correcta." : reauth);

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[account] No se puede eliminar la cuenta: falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
    return fail("No se puede eliminar la cuenta ahora mismo. Inténtalo más tarde.");
  }

  // El id sale de la sesión validada, nunca del formulario.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account] deleteUser ha fallado", { code: error.code ?? null, status: error.status ?? null });
    return fail("No se ha podido eliminar la cuenta. Inténtalo de nuevo.");
  }

  // Comprobación de que la cascada ha hecho su trabajo. Solo se registra qué
  // tabla ha quedado con filas, nunca el id del usuario.
  for (const [table, column] of USER_TABLES) {
    const { count, error: countError } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(column, user.id);
    if (countError) continue; // tabla sin crear en este proyecto: no hay nada que comprobar
    if (count && count > 0) {
      console.error(`[account] Tras eliminar una cuenta quedan ${count} filas en ${table}. Revisa sus claves foráneas.`);
    }
  }

  // La sesión ya no vale (el usuario no existe). Se borran sus cookies.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-")) cookieStore.delete(name);
  }

  redirect(`${routes.login}?cuenta=eliminada`);
}

/* ------------------------ Aceptar los Términos vigentes -------------------- */

/**
 * Registra que el usuario acepta la versión vigente de los Términos. Para las
 * cuentas creadas antes de que existiera el registro de aceptaciones, o cuando
 * se publique una versión nueva. La función SQL toma el usuario de
 * `auth.uid()` y solo inserta: una aceptación anterior no se modifica.
 */
export async function acceptCurrentTermsAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return fail("El servicio de cuentas no está disponible ahora mismo.");
  if (formData.get("acceptTerms") !== "on") return fail("Marca la casilla para aceptar los Términos.");
  if (readText(formData, "termsVersion") !== TERMS_VERSION) {
    return fail("Los Términos se han actualizado. Recarga la página y revísalos.");
  }

  const user = await getCurrentUser();
  if (!user) return fail("Tu sesión ha caducado. Vuelve a iniciar sesión.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("accept_legal_document", {
    p_type: "terms",
    p_version: TERMS_VERSION,
  });

  if (error || !(data as { accepted?: boolean } | null)?.accepted) {
    if (error) logSupabaseFailure("legal", "accept_legal_document", describeSupabaseError(error));
    return fail("No se ha podido registrar la aceptación ahora mismo. Inténtalo más tarde.");
  }

  revalidatePath(routes.account);
  return { error: null, notice: null, success: "Aceptación registrada." };
}
