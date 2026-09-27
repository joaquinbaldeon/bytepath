import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Confirmar que quien pide algo delicado (cambiar la contraseña, eliminar la
 * cuenta) es de verdad el dueño, y no alguien con la sesión abierta en un
 * ordenador ajeno.
 */

/**
 * ¿Es correcta esta contraseña para este correo?
 *
 * Usa un cliente TEMPORAL, sin cookies: comprobar la contraseña no debe tocar
 * la sesión de la persona. La sesión que abre esa comprobación se cierra en el
 * acto (`scope: "local"`: solo esa, no las demás del usuario).
 */
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const { url, key } = requireSupabaseEnv();
  const probe = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;

  await probe.auth.signOut({ scope: "local" }).catch(() => undefined);
  return true;
}

/** Ventana en la que un acceso por enlace de recuperación cuenta como "reciente". */
const RECENT_LINK_AUTH_SECONDS = 15 * 60;

/**
 * Métodos de autenticación (`amr`) que cuentan como "ha demostrado controlar su
 * correo con un enlace de un solo uso". LISTA BLANCA a propósito: BytePath solo
 * ofrece correo + contraseña y la recuperación por enlace. Supabase marca esa
 * recuperación como `recovery` (flujo PKCE) u `otp` (enlace con token_hash).
 *
 * Cualquier otro método (`oauth`, `sso/saml`, `web3`, `anonymous`, `mfa/*`,
 * `magiclink`, `email/signup`...) NO permite cambiar la contraseña sin la
 * actual. Si algún día se activa otro proveedor, esta lista NO lo desbloquea:
 * habrá que revisarlo aquí a mano.
 */
const RECOVERY_LINK_METHODS: ReadonlySet<string> = new Set(["recovery", "otp"]);

/**
 * La sesión actual se abrió hace poco con el enlace de recuperación enviado al
 * correo, no con la contraseña.
 *
 * Es lo que permite elegir una contraseña nueva SIN escribir la actual: quien
 * ha abierto ese enlace ha demostrado que controla el correo, que es
 * exactamente lo que demuestra la recuperación. Pasados 15 minutos, o con
 * cualquier otro método, se vuelve a pedir la actual. Eliminar la cuenta pide
 * SIEMPRE la contraseña, sin excepción.
 *
 * Sale de `amr` (métodos de autenticación) del token, que firma Supabase.
 */
export async function hasRecentLinkAuthentication(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return false;

  const amr = (data.claims as { amr?: unknown }).amr;
  if (!Array.isArray(amr)) return false;

  const now = Math.floor(Date.now() / 1000);
  return amr.some((entry) => {
    const { method, timestamp } = (entry ?? {}) as { method?: unknown; timestamp?: unknown };
    return (
      typeof method === "string" &&
      RECOVERY_LINK_METHODS.has(method) &&
      typeof timestamp === "number" &&
      now - timestamp <= RECENT_LINK_AUTH_SECONDS
    );
  });
}
