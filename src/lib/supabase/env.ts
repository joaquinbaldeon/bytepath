/**
 * Configuración de Supabase.
 *
 * Las dos variables llevan el prefijo NEXT_PUBLIC_ a propósito: la clave
 * publicable está pensada para viajar al navegador y por sí sola no da acceso a
 * nada, porque quien decide qué puede leer o escribir cada usuario son las
 * políticas RLS de la base de datos.
 *
 * La clave secreta (service role) NO aparece aquí ni en ningún módulo que el
 * cliente pueda importar: vive en `admin.ts`, solo de servidor, en una variable
 * sin NEXT_PUBLIC_ (SUPABASE_SERVICE_ROLE_KEY).
 *
 * Supabase renombró la "anon key" a "publishable key"; los paneles en
 * transición todavía muestran una u otra, así que se aceptan ambas.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Sin configuración, BytePath sigue funcionando: el contenido público no
 * necesita cuentas. Es el mismo criterio que con Judge0, que responde
 * "unavailable" en vez de romper la aplicación.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

/** Para los caminos que sí exigen Supabase: falla claro, no a medias. */
export function requireSupabaseEnv(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase no está configurado: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY };
}
