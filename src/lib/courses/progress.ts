import type { Course, Lesson, Module } from "@/lib/courses/types";

/**
 * Progreso de ejemplo mientras no hay autenticación ni base de datos.
 *
 * Cuando exista un usuario real, basta con sustituir `demoProgress` por la
 * consulta correspondiente y mantener la firma de las funciones de este archivo:
 * el resto de la aplicación no necesita cambiar.
 */
const demoProgress: Record<string, string[]> = {
  "cpp-fundamentos": ["que-es-cpp", "tu-primer-programa"],
};

export type LessonStatus = "completed" | "current" | "upcoming";

export type CourseProgress = {
  completed: number;
  total: number;
  percent: number;
  started: boolean;
  finished: boolean;
};

export function getCompletedLessonSlugs(courseSlug: string): string[] {
  return demoProgress[courseSlug] ?? [];
}

function allLessons(course: Course): { module: Module; lesson: Lesson }[] {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ module, lesson })),
  );
}

export function getCourseProgress(course: Course): CourseProgress {
  const lessons = allLessons(course);
  const completedSlugs = new Set(getCompletedLessonSlugs(course.slug));
  const completed = lessons.filter(({ lesson }) => completedSlugs.has(lesson.slug)).length;
  const total = lessons.length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    started: completed > 0,
    finished: total > 0 && completed === total,
  };
}

/**
 * La lección "actual" es la primera sin completar: es el punto por el que se
 * retoma el curso. Ninguna lección se bloquea, de momento se puede visitar todo.
 */
export function getLessonStatus(course: Course, lessonSlug: string): LessonStatus {
  const completedSlugs = new Set(getCompletedLessonSlugs(course.slug));
  if (completedSlugs.has(lessonSlug)) return "completed";

  const firstPending = allLessons(course).find(({ lesson }) => !completedSlugs.has(lesson.slug));
  return firstPending?.lesson.slug === lessonSlug ? "current" : "upcoming";
}

/** Lección por la que empezar o continuar el curso. */
export function getResumeLesson(course: Course): Lesson | undefined {
  const completedSlugs = new Set(getCompletedLessonSlugs(course.slug));
  const lessons = allLessons(course);
  const pending = lessons.find(({ lesson }) => !completedSlugs.has(lesson.slug));
  return (pending ?? lessons[0])?.lesson;
}

/**
 * Costura para la persistencia futura.
 *
 * Hoy el completado vive solo en memoria: se pierde al recargar la página y no
 * lo ven los componentes de servidor, que siguen leyendo `demoProgress`. Cuando
 * existan cuentas y base de datos, esta función pasará a escribir de verdad y
 * las de lectura de arriba consultarán la misma fuente; ningún componente
 * necesita cambiar.
 */
const completedThisSession = new Map<string, Set<string>>();

export function markLessonCompleted(courseSlug: string, lessonSlug: string): void {
  const lessons = completedThisSession.get(courseSlug) ?? new Set<string>();
  lessons.add(lessonSlug);
  completedThisSession.set(courseSlug, lessons);
}

export function isCompletedThisSession(courseSlug: string, lessonSlug: string): boolean {
  return completedThisSession.get(courseSlug)?.has(lessonSlug) ?? false;
}

export function getModuleProgress(course: Course, module: Module) {
  const completedSlugs = new Set(getCompletedLessonSlugs(course.slug));
  const completed = module.lessons.filter((lesson) => completedSlugs.has(lesson.slug)).length;
  return { completed, total: module.lessons.length };
}
