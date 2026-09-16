import type { Course } from "@/lib/courses/types";
import { cppFundamentos } from "@/content/courses/cpp-fundamentos";
import { introProgramacionCompetitiva } from "@/content/courses/introduccion-programacion-competitiva";

/**
 * Catálogo de cursos. Para añadir uno nuevo: crea su archivo en esta carpeta y
 * añádelo a este array. El orden aquí es el orden del listado.
 */
export const courses: Course[] = [cppFundamentos, introProgramacionCompetitiva];
