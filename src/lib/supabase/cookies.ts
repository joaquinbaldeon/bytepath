/**
 * Atributos de las cookies de sesión de Supabase.
 *
 * `@supabase/ssr` (0.12.7) escribe sus cookies con `path=/`, `SameSite=Lax`,
 * `HttpOnly` desactivado, sin `Secure` y con una duración FIJA de 400 días que
 * ignora cualquier `maxAge` que se le pase. Como BytePath controla la función
 * que escribe cada cookie (`setAll`, en servidor y en navegador), los atributos
 * se ajustan ahí, justo antes de escribir:
 *
 *   · Secure    lo decide quien escribe, porque solo él sabe por dónde va:
 *               - servidor: `serverCookiesSecure()` (src/lib/site-url.ts),
 *                 a partir de la configuración (`SITE_URL`), nunca de
 *                 cabeceras que pueda escribir el cliente;
 *               - navegador: `location.protocol === "https:"`, exacto.
 *               Por https siempre lleva Secure. Por http (desarrollo, demo en
 *               red local) no puede llevarlo: el navegador la descartaría.
 *   · SameSite  Lax. Strict rompería la llegada desde el enlace del correo de
 *               confirmación (una navegación desde otro sitio sin cookies).
 *   · HttpOnly  NO, a propósito, y no por olvido: el cliente de Supabase del
 *               navegador lee y renueva la sesión (UserMenu, store.ts,
 *               LoginForm/RegisterForm, cierre de sesión). Qué habría que
 *               cambiar para quitarlo: docs/security-privacy.md §8.
 *   · Duración  30 días. Se renueva cada vez que se escribe la cookie (al
 *               refrescar el token, con uso normal cada hora), así que solo
 *               caduca tras 30 días SIN usar BytePath. DECISIÓN DE PRODUCTO:
 *               ajustable aquí.
 *
 * Una cookie que se está borrando llega con `maxAge: 0`, y eso se respeta.
 * Este módulo no lee variables de entorno: sirve igual en servidor y navegador.
 */

export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type CookieAttributes = {
  maxAge?: number;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  httpOnly?: boolean;
};

export function hardenAuthCookie<T extends CookieAttributes>(options: T | undefined, secure: boolean): T {
  const base = (options ?? {}) as T;
  const deleting = base.maxAge === 0;
  return {
    ...base,
    sameSite: "lax",
    httpOnly: false,
    secure,
    maxAge: deleting ? 0 : Math.min(base.maxAge ?? SESSION_COOKIE_MAX_AGE, SESSION_COOKIE_MAX_AGE),
  };
}
