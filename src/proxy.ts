import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/env";
import { hardenAuthCookie } from "@/lib/supabase/cookies";
import { serverCookiesSecure } from "@/lib/site-url";

/**
 * Refresco de la sesión en cada petición.
 *
 * En Next 16 esto es `proxy.ts`: el antiguo `middleware.ts` está deprecado.
 *
 * Aquí NO se decide quién puede entrar a dónde. La documentación de Next es
 * explícita: el proxy sirve para comprobaciones optimistas, no como capa de
 * autorización, porque corre también en las rutas que el navegador precarga.
 * Quien decide de verdad son las políticas RLS de la base de datos y, en la
 * aplicación, las comprobaciones junto al dato (`src/lib/auth/session.ts`).
 *
 * Lo único que se hace aquí es mantener viva la sesión: si el token ha
 * caducado, `getClaims()` lo renueva y las cookies nuevas se escriben en la
 * respuesta.
 */
export async function proxy(request: NextRequest) {
  // Sin Supabase configurado, BytePath funciona igual: todo el contenido
  // público sigue siendo accesible, simplemente no hay sesión que refrescar.
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, hardenAuthCookie(options, serverCookiesSecure()));
        }
        // Sin estas cabeceras, un CDN o proxy intermedio podría cachear una
        // respuesta que lleva cookies de sesión y servírsela a otra persona.
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  // Verifica la firma del JWT y renueva el token si hacía falta.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Todas las rutas salvo los recursos estáticos, que no tienen sesión que
  // refrescar y solo añadirían trabajo por petición.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
