import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverCookiesSecure } from "@/lib/site-url";
import { hardenAuthCookie } from "@/lib/supabase/cookies";
import { requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cliente de Supabase para código de servidor: componentes de servidor,
 * Server Actions y route handlers.
 *
 * En Next 16 `cookies()` es asíncrono, así que esta función también lo es. Se
 * crea un cliente nuevo por petición a propósito: reutilizar uno entre
 * peticiones mezclaría sesiones de usuarios distintos.
 */
export async function createSupabaseServerClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, hardenAuthCookie(options, serverCookiesSecure()));
          }
        } catch {
          // Un componente de servidor no puede escribir cookies: solo pueden
          // hacerlo las Server Actions y los route handlers. No es un error,
          // porque el refresco real del token ocurre en `proxy.ts`, que sí
          // controla la respuesta.
        }
      },
    },
  });
}
