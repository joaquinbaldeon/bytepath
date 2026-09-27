import type { Course, Lesson, Module } from "@/lib/courses/types";

/**
 * Orden y desbloqueo de las lecciones de un curso.
 *
 * Funciones puras, sin acceso a datos: reciben lo que ya está completado y
 * responden. Las usan tanto el servidor —que es quien decide de verdad si se
 * puede entrar— como la interfaz, que solo las usa para pintar.
 *
 * Regla de desbloqueo: lineal. La lección N se desbloquea al completar la N-1;
 * la primera del curso está siempre abierta. El orden es el del contenido
 * (módulo tras módulo, lección tras lección), el mismo que ya seguía el
 * índice del curso.
 */

export type OrderedLesson = { module: Module; lesson: Lesson; index: number };

export function orderedLessons(course: Course): OrderedLesson[] {
  return course.modules
    .flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })))
    .map((entry, index) => ({ ...entry, index }));
}

/** La lección que hay que completar antes de esta, o `undefined` si es la primera. */
export function getPrerequisite(course: Course, lessonSlug: string): OrderedLesson | undefined {
  const lessons = orderedLessons(course);
  const index = lessons.findIndex((entry) => entry.lesson.slug === lessonSlug);
  return index > 0 ? lessons[index - 1] : undefined;
}

/**
 * ¿Se puede entrar a esta lección por lo que lleva completado el estudiante?
 *
 * `enforce` es falso cuando no hay dónde guardar el progreso (el proyecto
 * sin Supabase configurado): sin persistencia, bloquear por progreso dejaría
 * el curso atascado en la primera lección para siempre, así que ahí no se
 * bloquea nada, como antes de que existiera el camino.
 */
export function isLessonUnlocked(
  course: Course,
  lessonSlug: string,
  completed: ReadonlySet<string>,
  enforce = true,
): boolean {
  if (!enforce) return true;
  const prerequisite = getPrerequisite(course, lessonSlug);
  return !prerequisite || completed.has(prerequisite.lesson.slug);
}
