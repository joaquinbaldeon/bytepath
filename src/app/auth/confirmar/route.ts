import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { routes } from "@/lib/site";
import { redirectToInternal, safeInternalPath } from "@/lib/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Destino del enlace que Supabase envía por correo: confirmación del registro
 * y recuperación de la contraseña (que termina en `/cuenta/contrasena`).
 *
 * Soporta las dos formas en que puede llegar, porque depende de cómo esté
 * configurado el proyecto:
 *   · `?code=...`                  flujo PKCE
 *   · `?token_hash=...&type=...`   enlace de un solo uso
 *
 * Al canjearlo se crea la sesión y se escriben sus cookies, por eso esto es un
 * route handler y no un componente: un componente de servidor no puede
 * escribir cookies.
 *
 * Redirecciones: SOLO a rutas internas de la lista (`safeInternalPath`) y sin
 * tomar el dominio de la petición (`redirectToInternal`, ver src/lib/site-url.ts).
 * Un `next` externo, `//…` o `javascript:` se descarta.
 */

const ALLOWED_NEXT = [routes.courses, routes.account, routes.passwordUpdate] as const;

function destination(next: string | null, type: EmailOtpType | null): string {
  if (type === "recovery") return routes.passwordUpdate;
  return safeInternalPath(next, ALLOWED_NEXT) ?? routes.courses;
}

const FAILED = `${routes.login}?error=${encodeURIComponent("El enlace de confirmación no es válido o ha caducado.")}`;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = destination(searchParams.get("next"), type);

  if (!isSupabaseConfigured()) return redirectToInternal(FAILED);

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return redirectToInternal(error ? FAILED : next);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    return redirectToInternal(error ? FAILED : next);
  }

  return redirectToInternal(FAILED);
}
