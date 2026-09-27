import { isLessonUnlocked, orderedLessons } from "@/lib/courses/access";
import type { QuizSnapshot } from "@/lib/courses/quizProgress";
import type { Course, Module } from "@/lib/courses/types";

/**
 * Progreso de un estudiante en un curso.
 *
 * Antes vivía en memoria del navegador y se perdía al recargar. Ahora la
 * fuente de verdad es Supabase (`lesson_activations`, ver `src/lib/courses/
 * server.ts`), y este archivo se queda con lo que siempre debió ser: funciones
 * puras que, dado ese progreso, calculan porcentajes, estados y por dónde
 * seguir. No leen nada por su cuenta; reciben el progreso como argumento, lo
 * que además las hace triviales de probar y utilizables desde servidor y
 * cliente.
 */

export type QuizStatus = "not_started" | "in_progress" | "completed";

/** Lo que se sabe de UNA lección que el estudiante ya ha iniciado. */
export type LessonProgress = {
  quizStatus: QuizStatus;
  /**
   * Instantánea del quiz en curso, ya validada contra el quiz real y puesta de
   * acuerdo con `solvedIds`. `null` si no hay nada que continuar.
   */
  snapshot: QuizSnapshot | null;
  /** Preguntas acertadas según el servidor: lo que de verdad cuenta para el requisito. */
  solvedIds: string[];
  /** El juez ha dado el desafío por resuelto (lo anota el servidor, no el navegador). */
  challengePassed: boolean;
  /** `completed_at` no es nulo: energía cobrada, tokens pagados, siguiente desbloqueada. */
  completed: boolean;
};

/** Progreso por slug de lección. Una lección sin entrada no se ha iniciado. */
export type CourseProgressMap = ReadonlyMap<string, LessonProgress>;

export const emptyProgress: CourseProgressMap = new Map();

export type LessonStatus = "completed" | "current" | "upcoming" | "locked";

export type CourseProgress = {
  completed: number;
  total: number;
  percent: number;
  started: boolean;
  finished: boolean;
};

export function completedSlugs(progress: CourseProgressMap): Set<string> {
  const slugs = new Set<string>();
  for (const [slug, lesson] of progress) {
    if (lesson.completed) slugs.add(slug);
  }
  return slugs;
}

export function getCourseProgress(course: Course, progress: CourseProgressMap): CourseProgress {
  const lessons = orderedLessons(course);
  const done = completedSlugs(progress);
  const completed = lessons.filter(({ lesson }) => done.has(lesson.slug)).length;
  const total = lessons.length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    started: completed > 0 || progress.size > 0,
    finished: total > 0 && completed === total,
  };
}

export function getModuleProgress(module: Module, progress: CourseProgressMap) {
  const done = completedSlugs(progress);
  const completed = module.lessons.filter((lesson) => done.has(lesson.slug)).length;
  return { completed, total: module.lessons.length };
}

/**
 * Lección por la que retomar el curso: la primera sin completar. Con el
 * desbloqueo lineal, es también la única desbloqueada que falta por hacer.
 */
export function getResumeLesson(course: Course, progress: CourseProgressMap) {
  const done = completedSlugs(progress);
  const lessons = orderedLessons(course);
  const pending = lessons.find(({ lesson }) => !done.has(lesson.slug));
  return (pending ?? lessons[0])?.lesson;
}

/**
 * Estado de una lección para el índice del curso.
 *
 *   completed  hecha
 *   current    la que toca ahora (primera sin completar)
 *   locked     falta completar la anterior
 *   upcoming   sin completar y sin bloqueo (solo ocurre cuando no se
 *              bloquea por progreso: sin Supabase, `enforce` = false)
 */
export function getLessonStatus(
  course: Course,
  lessonSlug: string,
  progress: CourseProgressMap,
  enforce = true,
): LessonStatus {
  const done = completedSlugs(progress);
  if (done.has(lessonSlug)) return "completed";

  const firstPending = orderedLessons(course).find(({ lesson }) => !done.has(lesson.slug));
  if (firstPending?.lesson.slug === lessonSlug) return "current";

  return isLessonUnlocked(course, lessonSlug, done, enforce) ? "upcoming" : "locked";
}
