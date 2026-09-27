import "server-only";

import { createHmac } from "node:crypto";
import { trustedClientIp } from "@/lib/security/clientIp";
import { getServerSecret, getSupabaseAdmin } from "@/lib/supabase/admin";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";

/**
 * Límites de peticiones, guardados en Supabase (`public.rate_limits`, ver
 * supabase/security.sql).
 *
 * Por qué no en memoria: el hosting no está determinado y Next.js suele correr
 * en varias instancias serverless; un contador en memoria no limitaría nada.
 * Por qué no un proveedor externo: Supabase ya es parte del servicio.
 *
 * Tres tipos de sujeto, de más a menos preciso:
 *   · usuario    su id. No depende de la IP. (Las ejecuciones de código usan
 *                su propia función con la sesión: `consume_run_quota`, ver
 *                /api/runs.)
 *   · IP         'ip:' + un identificador derivado de la IP con una clave del
 *                servidor (HMAC-SHA256). SOLO si el despliegue declara una
 *                cabecera de IP fiable (src/lib/security/clientIp.ts). La IP en
 *                claro no se guarda. El identificador NO es anónimo: quien
 *                tenga la clave podría recalcularlo para una IP concreta; por
 *                eso dura poco (ver security.sql) y no se cruza con nada.
 *   · global     'global': un tope común para todo el sitio, para lo que no
 *                tiene sesión cuando no hay IP fiable.
 */

export type LimitRule = { bucket: string; limit: number; windowSeconds: number };

export type RateLimitResult =
  | { status: "allowed" }
  | { status: "limited"; retryAfter: number }
  /** No se ha podido comprobar (sin clave de servicio, o security.sql sin aplicar). */
  | { status: "unavailable" };

/** Comprobaciones de nombre de usuario en el registro, por IP fiable. */
export const USERNAME_CHECK_LIMIT: LimitRule = { bucket: "username-check", limit: 20, windowSeconds: 10 * 60 };
/**
 * Tope global de comprobaciones de nombre cuando NO hay IP fiable. Al
 * superarlo no se bloquea el registro: solo se deja de hacer la comprobación
 * anticipada (ver signUpAction).
 */
export const USERNAME_CHECK_GLOBAL_LIMIT: LimitRule = { bucket: "username-check:all", limit: 120, windowSeconds: 10 * 60 };
/** Solicitudes de recuperación de contraseña, por IP fiable. */
export const PASSWORD_RESET_LIMIT: LimitRule = { bucket: "password-reset", limit: 5, windowSeconds: 15 * 60 };
/**
 * Inicios de sesión FALLIDOS por IP fiable. Solo cuentan los fallos: una clase
 * entera entrando bien desde la misma red no consume nada.
 */
export const LOGIN_FAILURE_LIMIT: LimitRule = { bucket: "login-fail", limit: 20, windowSeconds: 15 * 60 };
/** Contraseña actual incorrecta al cambiarla o al eliminar la cuenta, por usuario. */
export const REAUTH_FAILURE_LIMIT: LimitRule = { bucket: "reauth-fail", limit: 5, windowSeconds: 15 * 60 };

/**
 * Respuestas de quiz corregidas, por usuario. Un quiz tiene seis preguntas:
 * 30 por minuto permite repetirlo varias veces seguidas, no recorrer
 * respuestas en masa.
 */
export const QUIZ_ANSWER_LIMIT: LimitRule = { bucket: "quiz-answer", limit: 30, windowSeconds: 60 };

/** Resto de acciones de progreso (empezar, guardar el punto del quiz, reiniciarlo, completar), por usuario. */
export const PROGRESS_ACTION_LIMIT: LimitRule = { bucket: "progress", limit: 60, windowSeconds: 60 };

type RawResult = { allowed: boolean; remaining: number; retry_after: number };

async function consume(rule: LimitRule, subject: string, userId: string | null): Promise<RateLimitResult> {
  const admin = getSupabaseAdmin();
  if (!admin) return { status: "unavailable" };

  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket: rule.bucket,
    p_subject: subject,
    p_user: userId,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });

  if (error || !data) {
    logSupabaseFailure("rate-limit", `consume_rate_limit(${rule.bucket})`, describeSupabaseError(error));
    return { status: "unavailable" };
  }

  const raw = data as RawResult;
  return raw.allowed ? { status: "allowed" } : { status: "limited", retryAfter: Math.max(1, raw.retry_after) };
}

async function isBlocked(rule: LimitRule, subject: string): Promise<boolean | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.rpc("rate_limit_blocked", {
    p_bucket: rule.bucket,
    p_subject: subject,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    logSupabaseFailure("rate-limit", `rate_limit_blocked(${rule.bucket})`, describeSupabaseError(error));
    return null;
  }
  return data === true;
}

/** Identificador de la IP fiable (HMAC), o `null` si no hay IP fiable o clave. */
async function ipSubject(): Promise<string | null> {
  const secret = getServerSecret();
  if (!secret) return null;
  const ip = await trustedClientIp();
  if (!ip) return null;
  return `ip:${createHmac("sha256", secret).update(ip).digest("base64url").slice(0, 32)}`;
}

export type AnonymousLimit = RateLimitResult & { scope: "ip" | "global" | "none" };

/**
 * Límite para lo que no tiene sesión: por IP fiable si la hay; si no, el tope
 * global indicado (o ninguno). Si no se puede comprobar, deja pasar: estas
 * rutas tienen además los límites de Supabase Auth, y bloquear por un fallo
 * nuestro sería peor que no limitar durante ese rato.
 */
export async function consumeAnonymousLimit(ipRule: LimitRule, globalRule?: LimitRule): Promise<AnonymousLimit> {
  const subject = await ipSubject();
  if (subject) {
    const result = await consume(ipRule, subject, null);
    return result.status === "unavailable" ? { status: "allowed", scope: "none" } : { ...result, scope: "ip" };
  }
  if (globalRule) {
    const result = await consume(globalRule, "global", null);
    return result.status === "unavailable" ? { status: "allowed", scope: "none" } : { ...result, scope: "global" };
  }
  return { status: "allowed", scope: "none" };
}

/**
 * Límite por usuario con sesión (su id sale de la cookie, nunca del cliente).
 * Si no se puede comprobar, deja pasar: la acción sigue sujeta a las reglas de
 * la base de datos, y cortar el estudio por un fallo nuestro sería peor.
 */
export async function consumeUserLimit(rule: LimitRule, userId: string): Promise<RateLimitResult> {
  const result = await consume(rule, userId, userId);
  return result.status === "unavailable" ? { status: "allowed" } : result;
}

/**
 * Límite de intentos FALLIDOS. `check()` antes de intentar (no cuenta nada);
 * `fail()` solo si el intento falla. Sujeto: el usuario (`userId`) o la IP
 * fiable; sin ninguno de los dos, no limita.
 */
export async function failureLimiter(rule: LimitRule, userId?: string) {
  const subject = userId ?? (await ipSubject());
  return {
    async blocked(): Promise<boolean> {
      if (!subject) return false;
      return (await isBlocked(rule, subject)) === true;
    },
    async fail(): Promise<void> {
      if (subject) await consume(rule, subject, userId ?? null);
    },
  };
}
