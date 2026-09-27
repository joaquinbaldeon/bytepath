import "server-only";

import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrerequisite, isLessonUnlocked } from "@/lib/courses/access";
import { getCourse, getLesson } from "@/lib/courses/api";
import {
  type CourseProgressMap,
  completedSlugs,
  emptyProgress,
  type LessonProgress,
  type QuizStatus,
} from "@/lib/courses/progress";
import { parseQuizSnapshot, reconcileSnapshot } from "@/lib/courses/quizProgress";
import type { Course, Lesson } from "@/lib/courses/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeSupabaseError, logSupabaseFailure, type SupabaseFailureKind } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lectura del progreso desde Supabase y decisión de acceso a una lección.
 *
 * Toda la lectura pasa por el cliente con la sesión del estudiante, así que la
 * seguridad de fila (RLS) es quien garantiza que solo vea sus propias filas:
 * aquí no hace falta —ni serviría— filtrar por usuario.
 */

export type CourseProgressResult = {
  /**
   * Si el progreso decide qué se puede abrir. Es falso solo cuando no hay
   * dónde guardarlo porque el proyecto no tiene Supabase configurado: sin
   * persistencia, bloquear por progreso dejaría el curso atascado en la primera
   * lección. Con Supabase configurado SIEMPRE se aplica, aunque la lectura
   * falle (ver `unavailable`): no hay ningún fallo que abra lecciones de más.
   */
  enforce: boolean;
  signedIn: boolean;
  /**
   * Hay cuentas y sesión, pero el progreso no se ha podido leer (lo más
   * probable: los SQL de `supabase/` sin aplicar). No se disfraza de progreso
   * vacío sin decirlo: la interfaz lo avisa.
   */
  unavailable: boolean;
  /** Causa clasificada del fallo, si `unavailable`. Para explicarlo en desarrollo, no para decidir nada. */
  failureKind?: SupabaseFailureKind;
  progress: CourseProgressMap;
};

type Row = {
  course_slug: string;
  lesson_slug: string;
  quiz_status: QuizStatus;
  quiz_state: unknown;
  quiz_solved: string[] | null;
  challenge_passed_at: string | null;
  completed_at: string | null;
};

const COLUMNS =
  "course_slug, lesson_slug, quiz_status, quiz_state, quiz_solved, challenge_passed_at, completed_at";

function toLessonProgress(lesson: Lesson, row: Row): LessonProgress {
  const questionIds = lesson.quiz?.questions.map((question) => question.id) ?? [];
  const solvedIds = (row.quiz_solved ?? []).filter((id) => questionIds.includes(id));
  const completed = row.completed_at !== null;

  return {
    quizStatus: row.quiz_status,
    // Solo tiene sentido continuar un quiz sin terminar. La instantánea guardada
    // por el navegador se pone de acuerdo con lo que el servidor sabe que está
    // acertado; si no cuadra con el quiz actual se ignora y se reconstruye
    // solo con los aciertos.
    snapshot:
      !completed && row.quiz_status !== "completed"
        ? reconcileSnapshot(
            row.quiz_status === "in_progress" ? parseQuizSnapshot(row.quiz_state, questionIds) : null,
            solvedIds,
            questionIds,
          )
        : null,
    solvedIds,
    challengePassed: row.challenge_passed_at !== null,
    completed,
  };
}

function groupByCourse(rows: Row[]): Map<string, Map<string, LessonProgress>> {
  const byCourse = new Map<string, Map<string, LessonProgress>>();

  for (const row of rows) {
    const course = getCourse(row.course_slug);
    const context = course && getLesson(course, row.lesson_slug);
    // Una fila de una lección que ya no existe en el contenido no cuenta.
    if (!course || !context) continue;

    const lessons = byCourse.get(course.slug) ?? new Map<string, LessonProgress>();
    lessons.set(context.lesson.slug, toLessonProgress(context.lesson, row));
    byCourse.set(course.slug, lessons);
  }

  return byCourse;
}

/** Todas las filas de progreso del estudiante actual, una sola consulta. */
const fetchAllProgress = cache(
  async (): Promise<
    | { status: "unmetered" }
    | { status: "signedOut" }
    | { status: "failed"; kind: SupabaseFailureKind }
    | { status: "ok"; byCourse: Map<string, Map<string, LessonProgress>> }
  > => {
    if (!isSupabaseConfigured()) return { status: "unmetered" };

    const user = await getCurrentUser();
    if (!user) return { status: "signedOut" };

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("lesson_activations").select(COLUMNS);

    if (error || !data) {
      // Se registra el error REAL (código, mensaje, detalles, pista) y su
      // causa clasificada: la más habitual es `schema_missing`, los SQL de
      // `supabase/` sin aplicar en este proyecto.
      const failure = describeSupabaseError(error);
      logSupabaseFailure("progress", "SELECT en lesson_activations", failure);
      return { status: "failed", kind: failure.kind };
    }

    return { status: "ok", byCourse: groupByCourse(data as Row[]) };
  },
);

/** Progreso del estudiante actual en un curso. */
export async function readCourseProgress(courseSlug: string): Promise<CourseProgressResult> {
  const result = await fetchAllProgress();

  switch (result.status) {
    case "unmetered":
      return { enforce: false, signedIn: false, unavailable: false, progress: emptyProgress };
    case "failed":
      return {
        enforce: true,
        signedIn: true,
        unavailable: true,
        failureKind: result.kind,
        progress: emptyProgress,
      };
    case "signedOut":
      // Sin sesión: hay camino, con la primera lección abierta y el resto
      // bloqueado por progreso, y entrar pide iniciar sesión.
      return { enforce: true, signedIn: false, unavailable: false, progress: emptyProgress };
    case "ok":
      return {
        enforce: true,
        signedIn: true,
        unavailable: false,
        progress: result.byCourse.get(courseSlug) ?? emptyProgress,
      };
  }
}

/** Progreso en TODOS los cursos: el catálogo lo necesita para sus tarjetas. */
export async function readAllCoursesProgress(): Promise<{
  enforce: boolean;
  byCourse: (courseSlug: string) => CourseProgressMap;
}> {
  const result = await fetchAllProgress();
  const byCourse = result.status === "ok" ? result.byCourse : new Map<string, CourseProgressMap>();

  return {
    enforce: result.status !== "unmetered",
    byCourse: (courseSlug) => byCourse.get(courseSlug) ?? emptyProgress,
  };
}

/* -------------------------- Acceso a una lección --------------------------- */

export type LessonAccess =
  /** Se puede leer y practicar. `persist` es falso cuando no hay dónde guardar progreso. */
  | { status: "open"; persist: boolean; progress: LessonProgress | null }
  | { status: "signin" }
  | { status: "locked"; prerequisite: { slug: string; title: string } }
  /** No se ha podido leer el progreso: se dice, no se adivina. */
  | { status: "unavailable"; failureKind?: SupabaseFailureKind };

/**
 * Decide si el estudiante actual puede entrar a una lección. Se ejecuta en el
 * servidor en cada visita, así que no depende de nada que el navegador diga.
 *
 * Entrar es GRATIS: ni esta función ni abrir la lección tocan la energía. La
 * energía se gasta solo al completar (`completeLessonAction`), y para
 * entonces `complete_lesson` vuelve a comprobar todo en la base de datos.
 * Que esta pantalla deje pasar no concede nada: leer es lo único que permite.
 */
export async function resolveLessonAccess(course: Course, lesson: Lesson): Promise<LessonAccess> {
  const { enforce, signedIn, unavailable, failureKind, progress } = await readCourseProgress(course.slug);

  // Sin Supabase configurado: abierto y sin persistencia.
  if (!enforce) return { status: "open", persist: false, progress: null };

  if (!signedIn) return { status: "signin" };
  if (unavailable) return { status: "unavailable", failureKind };

  if (!isLessonUnlocked(course, lesson.slug, completedSlugs(progress))) {
    const prerequisite = getPrerequisite(course, lesson.slug);
    return {
      status: "locked",
      prerequisite: {
        slug: prerequisite?.lesson.slug ?? "",
        title: prerequisite?.lesson.title ?? "la lección anterior",
      },
    };
  }

  return { status: "open", persist: true, progress: progress.get(lesson.slug) ?? null };
}
