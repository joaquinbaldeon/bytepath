import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Cliente de Supabase con la clave SECRETA (service role), solo para el
 * servidor.
 *
 * Es la única llave que puede ejecutar las funciones que escriben progreso,
 * energía y tokens (`start_lesson`, `record_quiz_answer`, `complete_lesson`...).
 * Esas funciones NO son invocables con la sesión del estudiante: si lo fueran,
 * cualquiera podría llamar a `complete_lesson` desde la consola del navegador y
 * saltarse el quiz. Por eso la escritura pasa siempre por aquí, después de que
 * el servidor haya comprobado quién es el usuario (cookie de sesión) y qué
 * exige la lección (el contenido).
 *
 * Reglas:
 *   · La variable NO lleva el prefijo NEXT_PUBLIC_: Next no la incluye jamás en
 *     el JavaScript del navegador. `import "server-only"` hace además que
 *     importar este módulo desde un componente de cliente sea un error de
 *     compilación.
 *   · Nunca se devuelve al navegador ni se escribe en un log.
 *   · El cliente no guarda sesión: no hay usuario detrás, solo la llave.
 */

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

let client: SupabaseClient | null = null;

/** ¿Está la clave secreta configurada en este servidor? */
export function isAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

/**
 * Cliente de servicio, o `null` si falta la clave. Quien lo llame debe tratar
 * `null` como "no se puede guardar progreso ahora mismo" y decirlo, no
 * simular que ha funcionado.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;

  client ??= createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/**
 * Secreto del servidor para derivar el identificador de la IP en el límite de
 * peticiones (HMAC). No es una anonimización: con esta clave se podría
 * recalcular el identificador de una IP concreta; sirve para no guardar la IP
 * en claro.
 *
 * Es `HMAC_SECRET` si está definida (32 caracteres o más: recomendado, así
 * rotar la clave de servicio no depende de esto) y, si no, la clave de
 * servicio. Si cambia, los identificadores cambian, y eso no importa: solo
 * sirven mientras dura la ventana del límite.
 */
const HMAC_SECRET = process.env.HMAC_SECRET;

export function getServerSecret(): string | null {
  if (HMAC_SECRET && HMAC_SECRET.length >= 32) return HMAC_SECRET;
  return SERVICE_KEY ?? null;
}
