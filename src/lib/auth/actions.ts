"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/form-state";
import { checkSignUpConsents } from "@/lib/auth/signup-consents";
import { validateUsername } from "@/lib/auth/username";
import { TERMS_VERSION } from "@/lib/legal/documents";
import {
  consumeAnonymousLimit,
  failureLimiter,
  LOGIN_FAILURE_LIMIT,
  PASSWORD_RESET_LIMIT,
  USERNAME_CHECK_GLOBAL_LIMIT,
  USERNAME_CHECK_LIMIT,
} from "@/lib/security/rateLimit";
import { getPublicOrigin } from "@/lib/site-url";
import { routes } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Registro, acceso y salida.
 *
 * Son Server Actions: la contraseña se envía al servidor y de ahí a Supabase.
 * No pasa por ningún handler propio, no se guarda en ninguna tabla nuestra y
 * no se le aplica hashing por nuestra cuenta; de eso se encarga Supabase Auth.
 *
 * Este archivo solo puede exportar funciones asíncronas: el tipo y el estado
 * inicial de los formularios viven en `form-state.ts`.
 */

/** Mínimo que acepta Supabase por defecto. */
const MIN_PASSWORD_LENGTH = 6;

const SERVICE_DOWN: AuthFormState = {
  error: "El servicio de cuentas no está disponible ahora mismo.",
  notice: null,
  success: null,
};

function fail(error: string): AuthFormState {
  return { error, notice: null, success: null };
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

/** Traduce los errores de Supabase sin filtrar detalles internos. */
function describeSignInError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Todavía no has confirmado tu correo. Revisa tu bandeja de entrada.";
  }
  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "Demasiados intentos seguidos. Espera un momento y vuelve a probar.";
  }
  return "No se ha podido iniciar sesión. Inténtalo de nuevo.";
}

/* ------------------------------- Registro -------------------------------- */

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return SERVICE_DOWN;

  const username = readText(formData, "username");
  const email = readText(formData, "email");
  const password = readText(formData, "password");
  const passwordConfirm = readText(formData, "passwordConfirm");

  const usernameError = validateUsername(username);
  if (usernameError) return fail(usernameError);

  if (!email) return fail("Escribe tu correo electrónico.");
  if (!email.includes("@")) return fail("Ese correo no parece válido.");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (password !== passwordConfirm) {
    return fail("Las dos contraseñas no coinciden.");
  }

  // Confirmación de 14 años o más y aceptación explícita de los Términos: dos
  // casillas independientes. El formulario no deja enviar sin marcarlas, pero
  // una Server Action es un endpoint público: se vuelven a comprobar aquí, antes
  // de tocar Supabase. La confirmación de edad no se guarda ni se envía a
  // Supabase (ver signup-consents.ts).
  const consentError = checkSignUpConsents(formData);
  if (consentError) return fail(consentError);
  // La versión que viene del formulario es la que se le enseñó. Si entretanto
  // se publicó otra, no se da por aceptada una versión que no ha visto.
  if (readText(formData, "termsVersion") !== TERMS_VERSION) {
    return fail(
      "Los Términos y Condiciones se han actualizado. Recarga la página, revísalos y vuelve a intentarlo.",
    );
  }

  const supabase = await createSupabaseServerClient();

  // Comprobación anticipada del nombre, solo para dar un mensaje decente. La
  // garantía de verdad es el índice único de la base de datos (abajo).
  //
  // La hace el SERVIDOR, con la clave de servicio: `username_available` ya no
  // es ejecutable desde el navegador. Cupo de comprobaciones:
  //   · con IP fiable (TRUSTED_IP_HEADER): 20 cada 10 min por IP; al superarlo
  //     se rechaza el intento;
  //   · sin IP fiable: un tope GLOBAL de 120 cada 10 min. Al superarlo NO se
  //     bloquea el registro de nadie: solo se omite esta comprobación y el alta
  //     sigue (el índice único rechaza un nombre repetido). Así una cabecera
  //     inventada no da cupo nuevo, y agotar el tope no deja a todos sin registro.
  const checkQuota = await consumeAnonymousLimit(USERNAME_CHECK_LIMIT, USERNAME_CHECK_GLOBAL_LIMIT);
  if (checkQuota.status === "limited" && checkQuota.scope === "ip") {
    return fail("Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.");
  }
  const admin = getSupabaseAdmin();
  if (admin && checkQuota.status !== "limited") {
    const { data: available, error: rpcError } = await admin.rpc("username_available", {
      candidate: username,
    });
    if (rpcError) logSupabaseFailure("auth", "username_available", describeSupabaseError(rpcError));
    else if (available === false) return fail("Ese nombre de usuario ya está en uso. Prueba con otro.");
  }

  const origin = await publicOriginForEmails();

  // Prueba de que el alta pasa por aquí, DESPUÉS de todas las comprobaciones
  // de arriba (14+, Términos, nombre). La firma la calcula la base de datos con
  // un secreto que no sale de ella, y un trigger la exige y la BORRA de los
  // metadatos (supabase/auth-guard.sql): un alta directa contra la API pública
  // de Supabase Auth no puede fabricarla.
  const signupProof = await issueSignupProof(email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Lo leen los triggers de alta, en la MISMA transacción que crea el
      // usuario: `guard_auth_user_insert` comprueba y retira la prueba,
      // `handle_new_user` crea la fila de profiles y `record_signup_terms`
      // anota qué versión de los Términos se aceptó. Si cualquiera falla, no se
      // crea la cuenta.
      data: { username, terms_version: TERMS_VERSION, ...(signupProof ? { signup_proof: signupProof } : {}) },
      emailRedirectTo: origin ? `${origin}/auth/confirmar` : undefined,
    },
  });

  if (error) {
    const normalized = error.message.toLowerCase();
    const code = error.code ?? "";

    // Con la confirmación de correo activada, Supabase NO avisa de que el correo
    // existe (responde como si hubiera funcionado), así que este caso solo
    // aparece si alguien la desactiva. Aun así, la respuesta no confirma si ese
    // correo tiene cuenta: se ofrece el camino para las dos posibilidades.
    if (normalized.includes("already registered") || normalized.includes("already exists")) {
      return fail(
        "No se ha podido crear la cuenta con esos datos. Si ya tienes una, inicia sesión o recupera tu contraseña.",
      );
    }
    // El plan gratuito de Supabase limita cuántos correos de confirmación
    // puede enviar por hora. Sin este caso, el fallo aparecía como un error
    // genérico y parecía un problema del formulario.
    if (code.includes("rate_limit") || normalized.includes("rate limit")) {
      return fail(
        "Se han enviado demasiados correos de confirmación en poco tiempo. Espera unos minutos y vuelve a intentarlo.",
      );
    }
    // Un trigger de alta ha fallado. Con la prueba de alta en regla, el caso
    // real es el índice único del username: dos personas registrando el mismo
    // nombre a la vez. Sin prueba (servidor sin clave de servicio), es la
    // exigencia de auth-guard.sql, y el nombre no tiene nada que ver.
    if (normalized.includes("database error")) {
      return fail(
        signupProof
          ? "Ese nombre de usuario acaba de ser ocupado. Prueba con otro."
          : "No se ha podido crear la cuenta ahora mismo. Inténtalo de nuevo más tarde.",
      );
    }
    if (normalized.includes("password")) {
      return fail(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    return fail("No se ha podido crear la cuenta. Inténtalo de nuevo.");
  }

  await checkTermsRecorded(data.user);

  // Si el proyecto exige confirmar el correo, no hay sesión todavía: no se
  // puede dar por autenticado al usuario.
  if (!data.session) {
    return {
      error: null,
      success: null,
      notice: `¡Cuenta creada! Te hemos enviado un correo a ${email}. Abre el enlace para confirmar tu cuenta y ya podrás entrar.`,
    };
  }

  return {
    error: null,
    notice: null,
    success: `¡Cuenta creada! Entrando como ${username}…`,
  };
}

/* -------------------------------- Acceso --------------------------------- */

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return SERVICE_DOWN;

  const email = readText(formData, "email");
  const password = readText(formData, "password");

  if (!email) return fail("Escribe tu correo electrónico.");
  if (!password) return fail("Escribe tu contraseña.");

  // Intentos FALLIDOS por IP fiable (20 cada 15 min). Solo cuentan los fallos:
  // una clase entera entrando bien desde la misma red no consume nada. Sin IP
  // fiable no hay límite de BytePath aquí y rige solo el de Supabase Auth (que
  // ve la IP del servidor: ver docs/security-privacy.md §5).
  const failures = await failureLimiter(LOGIN_FAILURE_LIMIT);
  if (await failures.blocked()) {
    return fail("Demasiados intentos fallidos desde esta conexión. Espera unos minutos y vuelve a probar.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) {
      await failures.fail();
    }
    return fail(describeSignInError(error.message));
  }

  // El nombre sale de `profiles`, que es la fuente de verdad. Los metadatos del
  // registro no se leen: quedan desactualizados si el nombre cambia.
  let username: string | null = null;
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .maybeSingle();
    username = profile?.username ?? null;
  }

  // No se redirige desde aquí a propósito: devolviendo el éxito, el formulario
  // puede confirmarlo en pantalla y es el cliente quien navega. Eso le da la
  // oportunidad de resincronizar su propia sesión de Supabase antes de salir
  // de la página, que es lo que mantiene la barra de navegación al día.
  return {
    error: null,
    notice: null,
    success: username ? `¡Hola de nuevo, ${username}! Entrando…` : "Sesión iniciada. Entrando…",
  };
}

/* --------------------------- Recuperar contraseña ------------------------- */

/**
 * Envía el enlace para elegir una contraseña nueva.
 *
 * La respuesta es SIEMPRE la misma, exista o no una cuenta con ese correo: así
 * este formulario no sirve para averiguar quién está registrado. El enlace
 * lleva a /auth/confirmar, que abre la sesión y manda a elegir la contraseña.
 */
export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return SERVICE_DOWN;

  const email = readText(formData, "email");
  if (!email || !email.includes("@")) return fail("Escribe el correo de tu cuenta.");

  // Por IP fiable (5 cada 15 min). Sin IP fiable no hay tope global a propósito:
  // agotarlo dejaría a todo el mundo sin poder recuperar su cuenta. Rigen los
  // límites de envío de correo de Supabase.
  const quota = await consumeAnonymousLimit(PASSWORD_RESET_LIMIT);
  if (quota.status === "limited") {
    return fail("Demasiadas solicitudes seguidas. Espera unos minutos y vuelve a probar.");
  }

  const origin = await publicOriginForEmails();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin
      ? `${origin}${routes.authConfirm}?next=${encodeURIComponent(routes.passwordUpdate)}`
      : undefined,
  });

  // Un error aquí (límite de correos de Supabase, correo mal formado...) no se
  // enseña: cambiaría la respuesta según el correo. Se registra sin el correo.
  if (error) {
    console.error("[auth] resetPasswordForEmail ha fallado", { code: error.code ?? null, status: error.status ?? null });
  }

  return {
    error: null,
    success: null,
    notice:
      "Si existe una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva. Si no llega en unos minutos, revisa el correo no deseado.",
  };
}

/* -------------------------------- Salida --------------------------------- */

/**
 * Cierra la sesión en Supabase: revoca el token y borra las cookies.
 *
 * Es una Server Action para que la salida quede cerrada también en el
 * servidor, no solo en el navegador. El cliente, además, limpia su propio
 * estado en memoria antes de invocarla (ver `UserMenu`).
 */
export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login?sesion=cerrada");
}

/**
 * Comprueba, solo para el log del servidor, que el alta dejó constancia de la
 * aceptación de los Términos en `legal_acceptances`. Si la tabla no existe
 * (legal.sql sin aplicar) o no hay fila, lo dice en voz alta: BytePath no debe
 * afirmar que guarda la aceptación si no lo está haciendo.
 *
 * No afecta al usuario: su cuenta ya está creada. Con la confirmación de correo
 * activada, un correo ya registrado devuelve un usuario ficticio sin
 * identidades: ese caso se ignora.
 */
async function checkTermsRecorded(user: { id: string; identities?: unknown[] | null } | null): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin || !user || (Array.isArray(user.identities) && user.identities.length === 0)) return;

  const { data, error } = await admin
    .from("legal_acceptances")
    .select("document_version")
    .eq("user_id", user.id)
    .eq("document_type", "terms")
    .limit(1);

  if (error) {
    logSupabaseFailure("legal", "comprobar la aceptación del alta", describeSupabaseError(error));
  } else if (!data || data.length === 0) {
    console.error("[legal] El alta no ha registrado la aceptación de los Términos. ¿Está aplicado supabase/legal.sql?");
  }
}

/**
 * Origen para los enlaces de los correos (confirmación, recuperación).
 *
 * Con SITE_URL, ese. En producción, SITE_URL es obligatoria: sin ella no se
 * usa ninguna cabecera de la petición y Supabase pone su propia Site URL. Solo
 * en desarrollo se usa la cabecera Origin (Next.js comprueba en las Server
 * Actions que coincide con Host, y Supabase solo acepta destinos de su lista
 * de Redirect URLs).
 */
async function publicOriginForEmails(): Promise<string | null> {
  const configured = getPublicOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  return (await headers()).get("origin");
}

/**
 * Pide a la base de datos la prueba de alta (`issue_signup_proof`, solo
 * service_role). Si no se puede, devuelve `null` y lo dice en el log: decide
 * la base de datos (con la exigencia activada, el alta se rechazará).
 */
async function issueSignupProof(email: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[auth] Sin SUPABASE_SERVICE_ROLE_KEY no se puede emitir la prueba de alta.");
    return null;
  }
  const { data, error } = await admin.rpc("issue_signup_proof", { p_email: email });
  if (error || typeof data !== "string") {
    logSupabaseFailure("auth", "issue_signup_proof", describeSupabaseError(error));
    return null;
  }
  return data;
}
