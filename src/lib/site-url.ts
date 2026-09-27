import "server-only";

import { NextResponse } from "next/server";

/**
 * Dirección pública de BytePath y todo lo que depende de ella: a dónde se
 * redirige después de un enlace del correo y si las cookies de sesión llevan
 * `Secure`.
 *
 * La fuente es la variable de servidor `SITE_URL` (p. ej.
 * `https://bytepath.example` o, para una demo en red local,
 * `http://192.168.1.20:3000`). NO se deduce de cabeceras de la petición: `Host`,
 * `X-Forwarded-Host` o `X-Forwarded-Proto` las puede escribir el cliente si
 * nadie delante las sobrescribe, y `request.url` en un servidor propio puede
 * ser la dirección de escucha (`0.0.0.0`, `localhost`), no la pública.
 *
 * Sin `SITE_URL`:
 *   · las redirecciones son RELATIVAS (`Location: /cursos`): el navegador se
 *     queda en el mismo sitio desde el que llegó, sea cual sea;
 *   · las cookies llevan `Secure` en producción (`next start`) y no en
 *     desarrollo (`next dev`).
 */

let cached: { origin: string | null; secure: boolean } | null = null;

function config() {
  if (cached) return cached;

  const raw = process.env.SITE_URL?.trim();
  let origin: string | null = null;

  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") origin = url.origin;
    } catch {
      // Valor mal escrito: se ignora y se avisa una vez, sin repetir el valor.
    }
    if (!origin) console.error("[site-url] SITE_URL no es una URL http(s) válida: se ignora.");
  }

  cached = {
    origin,
    secure: origin ? origin.startsWith("https:") : process.env.NODE_ENV === "production",
  };
  return cached;
}

/** Origen público configurado, o `null` si no hay `SITE_URL`. */
export function getPublicOrigin(): string | null {
  return config().origin;
}

/**
 * Si el servidor debe escribir las cookies de sesión con `Secure`.
 *
 *   · `SITE_URL` https → sí, siempre.
 *   · `SITE_URL` http (demo en red local) → no: el navegador descartaría una
 *     cookie `Secure` recibida por http y la sesión no se guardaría.
 *   · sin `SITE_URL` → sí en producción, no en desarrollo. En producción por
 *     http fuera de localhost hay que declarar `SITE_URL` (ver .env.example).
 *
 * El navegador decide por su cuenta con `location.protocol`, que es exacto
 * (ver src/lib/supabase/client.ts).
 */
export function serverCookiesSecure(): boolean {
  return config().secure;
}

/**
 * Ruta interna segura a partir de un parámetro `next`. Solo devuelve rutas de
 * la lista permitida; cualquier otra cosa (`https://…`, `//…`, `/\…`,
 * `javascript:…`, rutas desconocidas) devuelve `null`.
 */
export function safeInternalPath(next: string | null, allowed: readonly string[]): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;

  // Normaliza como lo haría el navegador y exige que siga en el mismo origen.
  const base = "http://bytepath.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;

  return allowed.includes(url.pathname) ? url.pathname + url.search : null;
}

/**
 * Redirección a una ruta INTERNA de BytePath. Con `SITE_URL`, absoluta a ese
 * origen; sin él, relativa. Nunca a un dominio que venga de la petición.
 */
export function redirectToInternal(path: string): NextResponse {
  if (!path.startsWith("/") || path.startsWith("//")) path = "/";
  const origin = getPublicOrigin();
  if (origin) return NextResponse.redirect(`${origin}${path}`, 303);
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}
