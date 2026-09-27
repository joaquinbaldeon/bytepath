import { getPrerequisite, isLessonUnlocked, orderedLessons } from "@/lib/courses/access";
import { lessonPath } from "@/lib/courses/api";
import { completedSlugs, type CourseProgressMap, type QuizStatus } from "@/lib/courses/progress";
import type { Course, LessonKind } from "@/lib/courses/types";

/**
 * El camino de aprendizaje de un curso, listo para pintar.
 *
 * Aquí se decide el ESTADO de cada nodo a partir del progreso persistido. Es
 * un cálculo puro y solo se ejecuta en el servidor: lo que llega al navegador
 * son datos planos ya resueltos, no el contenido de las lecciones ni las
 * reglas de desbloqueo.
 *
 * Un estado que este archivo NO decide: "esperando energía". La energía solo
 * se gasta al COMPLETAR, así que no bloquea abrir ninguna lección; lo único
 * que puede esperar por ella es una lección con todos sus requisitos cumplidos
 * (`ready`). Y eso depende de la energía de ahora mismo, que cambia sola con
 * el reloj, así que lo deriva la interfaz a partir del estado vivo de la cuenta.
 *
 * Progresión lineal: la lección N se abre al completar la N-1. Eso deja SIEMPRE
 * como mucho una lección desbloqueada y sin completar (`isCurrent`), que es
 * "la siguiente" si no se ha empezado y "en progreso" si sí.
 */

export type PathState = "completed" | "in_progress" | "available" | "locked";

export type PathLesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  hasQuiz: boolean;
  hasChallenge: boolean;
  state: PathState;
  /** La que toca ahora: la primera sin completar y desbloqueada. Solo hay una por curso. */
  isCurrent: boolean;
  /** Ya está iniciada: hay fila de progreso. Abrirla nunca cuesta energía. */
  started: boolean;
  /**
   * Quiz y desafío (los que haya) cumplidos, y la lección sin completar: solo
   * falta completarla, que es lo que gasta 1 ⚡.
   */
  ready: boolean;
  quizStatus: QuizStatus;
  quizSolved: number;
  quizTotal: number;
  /** Título de la lección que hay que completar antes, si está bloqueada por progreso. */
  lockedBy: string | null;
  href: string;
};

export type PathModule = {
  slug: string;
  title: string;
  summary?: string;
  /** Posición del módulo en el curso, desde 1. */
  number: number;
  lessons: PathLesson[];
  completed: number;
  total: number;
  minutes: number;
  challenges: number;
};

export function buildPath(course: Course, progress: CourseProgressMap, enforce: boolean): PathModule[] {
  const done = completedSlugs(progress);
  const ordered = orderedLessons(course);
  const firstPending = ordered.find(({ lesson }) => !done.has(lesson.slug))?.lesson.slug;

  return course.modules.map((module, moduleIndex) => {
    const lessons: PathLesson[] = module.lessons.map((lesson) => {
      const row = progress.get(lesson.slug);
      const unlocked = isLessonUnlocked(course, lesson.slug, done, enforce);

      const state: PathState = row?.completed
        ? "completed"
        : !unlocked
          ? "locked"
          : row
            ? "in_progress"
            : "available";

      return {
        slug: lesson.slug,
        title: lesson.title,
        kind: lesson.kind,
        minutes: lesson.estimatedMinutes,
        hasQuiz: lesson.quiz !== null,
        hasChallenge: lesson.challenge !== null,
        state,
        isCurrent: lesson.slug === firstPending && unlocked,
        started: row !== undefined,
        ready:
          state === "in_progress" &&
          (lesson.quiz === null || row?.quizStatus === "completed") &&
          (lesson.challenge === null || row?.challengePassed === true),
        quizStatus: row?.quizStatus ?? "not_started",
        quizSolved: row?.solvedIds.length ?? 0,
        quizTotal: lesson.quiz?.questions.length ?? 0,
        lockedBy: state === "locked" ? (getPrerequisite(course, lesson.slug)?.lesson.title ?? null) : null,
        href: lessonPath(course.slug, lesson.slug),
      };
    });

    return {
      slug: module.slug,
      title: module.title,
      summary: module.summary,
      number: moduleIndex + 1,
      lessons,
      completed: lessons.filter((lesson) => lesson.state === "completed").length,
      total: lessons.length,
      minutes: lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
      challenges: lessons.filter((lesson) => lesson.hasChallenge).length,
    };
  });
}
