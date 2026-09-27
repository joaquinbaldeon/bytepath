import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";

/**
 * IP del cliente, SOLO si el despliegue declara de dónde fiarse.
 *
 * Next.js no expone la IP de la conexión. Lo que llega son cabeceras
 * (`X-Forwarded-For`, `X-Real-IP`...), y cualquiera puede enviarlas inventadas:
 * si nadie delante las sobrescribe, "la IP" es lo que el cliente quiera. Por
 * eso, por defecto, NINGUNA cabecera se trata como identidad y esta función
 * devuelve `null`: los límites por IP no se aplican y quedan los que no
 * dependen de ella (por usuario, y topes globales).
 *
 * Para usar la IP hay que declararlo en el servidor:
 *
 *   TRUSTED_IP_HEADER   nombre de la cabecera que ESCRIBE (no reenvía) el
 *                       proxy o el hosting delante de BytePath. Admitidas:
 *                       x-forwarded-for, x-real-ip, cf-connecting-ip,
 *                       x-vercel-forwarded-for.
 *   TRUSTED_PROXY_COUNT solo para listas (x-forwarded-for,
 *                       x-vercel-forwarded-for): cuántos proxys de confianza
 *                       AÑADEN su entrada al final. Por defecto 1. Se toma la
 *                       entrada que añadió el más externo de ellos, nunca la
 *                       primera: la primera la puede escribir el cliente.
 *
 * Qué valor poner depende del hosting y hay que comprobarlo en su
 * documentación (docs/security-privacy.md §7). Ante una configuración no
 * válida, se avisa una vez y se trata como "sin IP fiable".
 */

const SINGLE_VALUE = new Set(["x-real-ip", "cf-connecting-ip"]);
const LIST_VALUE = new Set(["x-forwarded-for", "x-vercel-forwarded-for"]);

let config: { header: string; hops: number } | null | undefined;

function readConfig(): { header: string; hops: number } | null {
  if (config !== undefined) return config;

  const header = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!header) return (config = null);

  if (!SINGLE_VALUE.has(header) && !LIST_VALUE.has(header)) {
    console.error("[client-ip] TRUSTED_IP_HEADER no es una cabecera admitida: no se usará la IP.");
    return (config = null);
  }

  const hops = Number(process.env.TRUSTED_PROXY_COUNT ?? "1");
  if (!Number.isInteger(hops) || hops < 1 || hops > 5) {
    console.error("[client-ip] TRUSTED_PROXY_COUNT debe ser un entero entre 1 y 5: no se usará la IP.");
    return (config = null);
  }

  return (config = { header, hops });
}

/** La IP del cliente según la cabecera declarada como fiable, o `null`. */
export async function trustedClientIp(): Promise<string | null> {
  const cfg = readConfig();
  if (!cfg) return null;

  const value = (await headers()).get(cfg.header);
  if (!value) return null;

  let candidate: string | undefined;
  if (LIST_VALUE.has(cfg.header)) {
    const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean);
    candidate = entries[entries.length - cfg.hops];
  } else {
    candidate = value.trim();
  }

  return candidate && isIP(candidate) ? candidate : null;
}
