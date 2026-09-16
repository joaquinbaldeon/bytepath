import { courses } from "@/content/courses";
import { getLessonStatus, type LessonStatus } from "@/lib/courses/progress";
import type {
  Course,
  Difficulty,
  Lesson,
  LessonKind,
  Module,
  QuestionKind,
} from "@/lib/courses/types";

/**
 * Único punto de acceso al contenido de los cursos. Hoy lee datos estáticos;
 * el día que exista una base de datos solo cambia la implementación de estas
 * funciones (pasando a ser asíncronas), no las páginas ni los componentes.
 */

export type LessonContext = {
  course: Course;
  module: Module;
  lesson: Lesson;
  /** Posición de la lección dentro del curso, empezando en 1. */
  position: number;
};

export function getCourses(): Course[] {
  return courses;
}

export function getCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function getCourseLessons(course: Course): LessonContext[] {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ course, module, lesson, position: 0 })),
  ).map((context, i) => ({ ...context, position: i + 1 }));
}

export function getLesson(course: Course, lessonSlug: string): LessonContext | undefined {
  return getCourseLessons(course).find((context) => context.lesson.slug === lessonSlug);
}

export function getAdjacentLessons(course: Course, lessonSlug: string) {
  const lessons = getCourseLessons(course);
  const index = lessons.findIndex((context) => context.lesson.slug === lessonSlug);
  return {
    previous: index > 0 ? lessons[index - 1] : undefined,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined,
  };
}

export function getCourseStats(course: Course) {
  const lessons = getCourseLessons(course);
  return {
    moduleCount: course.modules.length,
    lessonCount: lessons.length,
    estimatedMinutes: lessons.reduce((total, { lesson }) => total + lesson.estimatedMinutes, 0),
  };
}

/* ---------------------------- Esquema de navegación --------------------------- */

export type OutlineLesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  status: LessonStatus;
};

export type OutlineModule = {
  slug: string;
  title: string;
  lessons: OutlineLesson[];
};

/** Versión ligera del curso para el índice lateral de la lección. */
export function buildCourseOutline(course: Course): OutlineModule[] {
  return course.modules.map((module) => ({
    slug: module.slug,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      kind: lesson.kind,
      status: getLessonStatus(course, lesson.slug),
    })),
  }));
}

/* ---------------------------------- Rutas ----------------------------------- */

export const coursesPath = "/cursos";

export function coursePath(courseSlug: string): string {
  return `/cursos/${courseSlug}`;
}

export function lessonPath(courseSlug: string, lessonSlug: string): string {
  return `/cursos/${courseSlug}/${lessonSlug}`;
}

/* --------------------------------- Etiquetas --------------------------------- */

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const lessonKindLabels: Record<LessonKind, string> = {
  theory: "Teoría",
  exercise: "Ejercicio",
  quiz: "Repaso",
};

export const questionKindLabels: Record<QuestionKind, string> = {
  concept: "Concepto",
  "what-does-it-do": "¿Qué hace este código?",
  "predict-output": "Predice la salida",
  "spot-error": "Encuentra el error",
  apply: "Aplica lo aprendido",
};

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
