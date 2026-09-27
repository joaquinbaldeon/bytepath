import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrerequisite } from "@/lib/courses/access";
import type { Course } from "@/lib/courses/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Puerta de escritura del progreso.
 *
 * Todas las funciones SQL que escriben progreso, energía o tokens son
 * ejecutables solo por `service_role` y reciben el usuario como parámetro
 * (`p_user`). Este módulo es el único que sabe construir esa llamada, y lo
 * hace en el orden que importa:
 *
 *   1. ¿hay Supabase?          → si no, "local": no hay dónde guardar.
 *   2. ¿quién es? (cookie)     → si no hay sesión, "not_signed_in". El id sale
 *                                de `auth.getUser()`, jamás de un parámetro.
 *   3. ¿hay clave de servicio? → si no, "unavailable", dicho en voz alta.
 *
 * Solo entonces se entrega un cliente. Una Server Action es un endpoint
 * público: cualquiera puede mandarle el POST sin pasar por la interfaz, y este
 * orden es lo que hace que eso no sirva de nada.
 */

export type Writer =
  | { status: "ready"; userId: string; admin: SupabaseClient }
  | { status: "local" | "not_signed_in" | "unavailable" };

export async function resolveWriter(): Promise<Writer> {
  if (!isSupabaseConfigured()) return { status: "local" };

  const user = await getCurrentUser();
  if (!user) return { status: "not_signed_in" };

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error(
      "[progress] Falta SUPABASE_SERVICE_ROLE_KEY en el servidor: no se puede guardar progreso, energía ni tokens. " +
        "Añádela a .env.local (Project Settings > API Keys > secret / service_role) y reinicia el servidor.",
    );
    return { status: "unavailable" };
  }

  return { status: "ready", userId: user.id, admin };
}

/** Llama a una función SQL de escritura. `null` = ha fallado (ya registrado en el log). */
export async function callWriter<T>(
  writer: Extract<Writer, { status: "ready" }>,
  fn: string,
  args: Record<string, unknown>,
): Promise<T | null> {
  const { data, error } = await writer.admin.rpc(fn, { p_user: writer.userId, ...args });

  if (error || data === null || data === undefined) {
    logSupabaseFailure("progress", `RPC ${fn}`, describeSupabaseError(error));
    return null;
  }

  return data as T;
}

/** Slug de la lección que hay que completar antes que esta, o `null` si es la primera. */
export function prerequisiteSlug(course: Course, lessonSlug: string): string | null {
  return getPrerequisite(course, lessonSlug)?.lesson.slug ?? null;
}

/**
 * Deja la lección iniciada (fila de progreso) antes de escribir sobre ella.
 * Es idempotente y gratis, y comprueba que la lección anterior esté completada:
 * es lo que impide crear —y por tanto completar— una lección bloqueada.
 */
export async function ensureStarted(
  writer: Extract<Writer, { status: "ready" }>,
  course: Course,
  lessonSlug: string,
): Promise<"ok" | "locked" | "unavailable"> {
  const result = await callWriter<{ started: boolean; reason: string | null }>(writer, "start_lesson", {
    p_course: course.slug,
    p_lesson: lessonSlug,
    p_prerequisite: prerequisiteSlug(course, lessonSlug),
  });

  if (!result) return "unavailable";
  if (!result.started) return result.reason === "locked" ? "locked" : "unavailable";
  return "ok";
}
