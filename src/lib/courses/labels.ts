import type { Difficulty, LessonKind, QuestionKind } from "@/lib/courses/types";

/**
 * Rutas, etiquetas y formato de los cursos: la parte de `api.ts` que NO toca el
 * contenido.
 *
 * Existe por una razón que no es de orden. `api.ts` importa el catálogo entero
 * (`@/content/courses`), y un componente de cliente que importe cualquier cosa
 * de `api.ts` hace que Next meta ese catálogo —toda la teoría, todos los
 * quizzes con sus respuestas— en el JavaScript que descarga el navegador. Aquí
 * no hay ningún import de contenido, así que los componentes de cliente pueden
 * usar estas funciones sin arrastrar nada. `api.ts` las reexporta para que el
 * código de servidor siga importando de un solo sitio.
 */

export const coursesPath = "/cursos";

export function coursePath(courseSlug: string): string {
  return `/cursos/${courseSlug}`;
}

export function lessonPath(courseSlug: string, lessonSlug: string): string {
  return `/cursos/${courseSlug}/${lessonSlug}`;
}

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
