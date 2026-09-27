import { createBrowserClient, parseCookieHeader, serialize } from "@supabase/ssr";
import { hardenAuthCookie } from "@/lib/supabase/cookies";
import { requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cliente de Supabase para componentes de cliente.
 *
 * Guarda la sesión en cookies, no en localStorage: así el servidor puede leer
 * la misma sesión en cada petición y no hay dos fuentes de verdad. Internamente
 * `createBrowserClient` reutiliza una única instancia, así que llamar a esta
 * función varias veces no crea clientes duplicados.
 */
export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key, {
    // Mismas cookies que la implementación por defecto (document.cookie), pero
    // escritas con los atributos de `hardenAuthCookie`: Secure si la página va
    // por https (el navegador lo sabe con exactitud), 30 días. Ver
    // src/lib/supabase/cookies.ts.
    cookies: {
      getAll() {
        return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? "" }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          document.cookie = serialize(name, value, hardenAuthCookie(options, location.protocol === "https:"));
        }
      },
    },
  });
}
