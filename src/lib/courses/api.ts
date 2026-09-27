import "server-only";

import { courses } from "@/content/courses";
import {
  type CourseProgressMap,
  getLessonStatus,
  type LessonStatus,
} from "@/lib/courses/progress";
import type { Course, Lesson, LessonKind, Module } from "@/lib/courses/types";

/**
 * Único punto de acceso al contenido de los cursos. Hoy lee datos estáticos;
 * el día que exista una base de datos solo cambia la implementación de estas
 * funciones (pasando a ser asíncronas), no las páginas ni los componentes.
 *
 * SOLO CÓDIGO DE SERVIDOR. Este archivo importa el catálogo completo, y un
 * componente de cliente que lo importe mete toda la teoría y todos los quizzes
 * en el JavaScript del navegador. Para rutas, etiquetas y formato desde un
 * componente de cliente, importa de `labels.ts`.
 */

export {
  coursePath,
  coursesPath,
  difficultyLabels,
  formatDuration,
  lessonKindLabels,
  lessonPath,
  questionKindLabels,
} from "@/lib/courses/labels";

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

/**
 * Curso y lección a los que pertenece un desafío, según el CONTENIDO. Es lo que
 * usa el servidor para decidir el acceso: el curso y la lección que diga el
 * navegador no cuentan.
 */
export function findChallenge(challengeId: string): { course: Course; lesson: Lesson } | undefined {
  for (const course of courses) {
    for (const courseModule of course.modules) {
      const lesson = courseModule.lessons.find((candidate) => candidate.challenge?.id === challengeId);
      if (lesson) return { course, lesson };
    }
  }
  return undefined;
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
export function buildCourseOutline(
  course: Course,
  progress: CourseProgressMap,
  enforce = true,
): OutlineModule[] {
  return course.modules.map((module) => ({
    slug: module.slug,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      kind: lesson.kind,
      status: getLessonStatus(course, lesson.slug, progress, enforce),
    })),
  }));
}

