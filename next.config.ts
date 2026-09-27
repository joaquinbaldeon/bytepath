import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad de todas las respuestas.
 *
 * CSP en su versión "sin nonces" de la guía de Next.js
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
 *
 *   · script-src 'unsafe-inline'  Next.js inyecta scripts en línea para
 *     hidratar la página (y BytePath uno propio, ThemeScript, para aplicar el
 *     tema sin parpadeo). La alternativa, nonces, obliga a renderizar TODAS las
 *     páginas bajo demanda (la Home, /premium y /terminos dejarían de ser
 *     estáticas) y la de hashes (SRI) es experimental. Queda como mejora
 *     futura (docs/security-privacy.md). Lo que sí se consigue: ningún script
 *     de otro dominio, ningún objeto/plugin, ningún iframe de BytePath en otra
 *     web y ningún envío de formularios fuera.
 *   · 'unsafe-eval' SOLO en desarrollo: React lo usa para reconstruir las pilas
 *     de error del servidor. En producción no se incluye.
 *   · style-src 'unsafe-inline'  el editor de código (CodeMirror) inyecta sus
 *     estilos en etiquetas <style>, y el HTML del servidor lleva atributos
 *     style (Framer Motion, anchos calculados del camino).
 *   · connect-src  el propio sitio y el proyecto de Supabase (el navegador
 *     renueva la sesión y lee su perfil directamente). Judge0 NO aparece: solo
 *     lo contacta el servidor. En desarrollo se añade ws: para la recarga en
 *     caliente.
 *   · Las fuentes se sirven desde el propio dominio (next/font), sin Google.
 */

const isDev = process.env.NODE_ENV === "development";

function supabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin()}${isDev ? " ws: wss:" : ""}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Que el navegador no "adivine" tipos de archivo distintos de los declarados.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Los enlaces a otros sitios no les cuentan desde qué página de BytePath se
  // llega (qué lección, qué curso). Dentro de BytePath sí se envía.
  { key: "Referrer-Policy", value: "same-origin" },
  // BytePath no usa cámara, micrófono, ubicación, pagos ni sensores.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Para navegadores que no entienden frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // HTTPS obligatorio durante un año, solo en producción. Sin includeSubDomains
  // ni preload: eso afecta a todo el dominio y es una DECISIÓN de quien lo
  // administre. En http (desarrollo) los navegadores lo ignoran igualmente.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  // No anunciar la tecnología del servidor en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
