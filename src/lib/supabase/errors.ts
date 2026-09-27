import "server-only";

/**
 * Diagnóstico de errores de Supabase para el log del servidor.
 *
 * Existe porque "no se ha podido leer el progreso" no le dice a nadie qué
 * arreglar, pero sin convertir el log en un almacén de datos personales:
 *
 *   · Se registran `code`, el tipo de fallo y un `message` SANEADO.
 *   · `details` NO se registra: PostgreSQL pone ahí la fila entera que falló
 *     ("Failing row contains (user_id, curso, lección, quiz_state...)") o el
 *     valor duplicado ("Key (lower(username))=(ana) already exists").
 *   · Del `message` se ocultan los valores entre comillas que no parezcan un
 *     identificador de esquema ('invalid input syntax for type uuid: "…"'),
 *     conservando los nombres de restricciones, tablas y columnas, que son lo
 *     que sirve para depurar.
 *   · Nunca la petición, las cabeceras, las cookies, los tokens ni las claves.
 */

export type SupabaseFailureKind =
  /** La tabla o la función no existe: los SQL de `supabase/` no se han aplicado en ESTE proyecto. */
  | "schema_missing"
  /** La tabla existe pero le falta una columna que el código espera: una versión antigua del SQL. */
  | "column_missing"
  /** El rol no tiene permiso (GRANT) o una política RLS lo impide. */
  | "permission"
  /** Sesión o clave rechazada. */
  | "auth"
  /** No se ha llegado a Supabase: URL mal escrita, sin red, proyecto pausado. */
  | "network"
  | "unknown";

export type SupabaseFailure = {
  kind: SupabaseFailureKind;
  code: string | null;
  /** Mensaje ya saneado (ver `sanitizeDbMessage`). */
  message: string;
  /** Si PostgreSQL traía `details`. Su contenido no se conserva. */
  hadDetails: boolean;
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_.]*$/;

/**
 * Oculta los valores de un mensaje de PostgreSQL/PostgREST. Lo que va entre
 * comillas y parece un identificador (`"profiles_username_format"`,
 * `'public.lesson_activations'`) se conserva; el resto se sustituye.
 * También se corta: ningún mensaje útil necesita más de 200 caracteres.
 */
export function sanitizeDbMessage(message: string): string {
  return message
    .replace(/"([^"]*)"/g, (whole, inner: string) => (IDENTIFIER.test(inner) ? whole : '"[valor]"'))
    .replace(/'([^']*)'/g, (whole, inner: string) => (IDENTIFIER.test(inner) ? whole : "'[valor]'"))
    .replace(/\)=\([^)]*\)/g, ")=([valor])")
    .slice(0, 200);
}

type ErrorLike = { code?: string; message?: string; details?: string | null; hint?: string | null };

export function describeSupabaseError(error: ErrorLike | null | undefined): SupabaseFailure {
  const code = error?.code ?? null;
  const message = error?.message ?? "Respuesta vacía de Supabase";

  let kind: SupabaseFailureKind = "unknown";
  if (
    // PostgREST: la relación / función no está en la caché de esquema.
    code === "PGRST205" ||
    code === "PGRST202" ||
    // PostgreSQL: undefined_table / undefined_function.
    code === "42P01" ||
    code === "42883"
  ) {
    kind = "schema_missing";
  } else if (code === "42703" || code === "PGRST204") {
    kind = "column_missing";
  } else if (code === "42501") {
    kind = "permission";
  } else if (code?.startsWith("PGRST3") || /jwt|invalid api key|apikey/i.test(message)) {
    kind = "auth";
  } else if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|timeout/i.test(message)) {
    kind = "network";
  }

  return { kind, code, message: sanitizeDbMessage(message), hadDetails: Boolean(error?.details) };
}

const advice: Record<SupabaseFailureKind, string> = {
  schema_missing:
    "Falta el esquema en este proyecto de Supabase. Ejecuta supabase/setup.sql en su SQL Editor (y comprueba con supabase/verify.sql).",
  column_missing:
    "La tabla existe pero le faltan columnas: es una versión antigua. Vuelve a ejecutar supabase/setup.sql (es idempotente).",
  permission: "Permiso denegado: revisa los GRANT y las políticas RLS (supabase/verify.sql lo comprueba).",
  auth: "Supabase ha rechazado la sesión o la clave: revisa las variables de entorno del servidor.",
  network: "No se ha llegado a Supabase: revisa NEXT_PUBLIC_SUPABASE_URL y que el proyecto no esté pausado.",
  unknown: "Error no clasificado: mira code/message.",
};

/** Escribe el fallo en el log del servidor, con lo que hace falta para arreglarlo y nada más. */
export function logSupabaseFailure(scope: string, operation: string, failure: SupabaseFailure): void {
  console.error(`[${scope}] ${operation} ha fallado → ${failure.kind}. ${advice[failure.kind]}`, {
    code: failure.code,
    message: failure.message,
    hadDetails: failure.hadDetails,
  });
}

export function adviceFor(kind: SupabaseFailureKind): string {
  return advice[kind];
}
