import type { Course } from "@/lib/courses/types";
import { primerosPasos } from "@/content/courses/cpp-fundamentos/modulo-1-primeros-pasos";
import { entradaSalida } from "@/content/courses/cpp-fundamentos/modulo-2-entrada-salida";
import { operadores } from "@/content/courses/cpp-fundamentos/modulo-3-operadores";
import { decisiones } from "@/content/courses/cpp-fundamentos/modulo-4-decisiones";
import { bucles } from "@/content/courses/cpp-fundamentos/modulo-5-bucles";
import { funciones } from "@/content/courses/cpp-fundamentos/modulo-6-funciones";
import { colecciones } from "@/content/courses/cpp-fundamentos/modulo-7-colecciones";
import { stlEsencial } from "@/content/courses/cpp-fundamentos/modulo-8-stl";

/**
 * Curso "C++ Fundamentos".
 *
 * El contenido vive en un archivo por módulo: son datos, y un único archivo con
 * el curso entero pasaría de las cinco mil líneas. Este índice solo declara la
 * ficha del curso y el orden de los módulos, que es el orden pedagógico.
 *
 * La progresión está pensada para que ningún concepto aparezca antes de que
 * haga falta: la entrada de datos va en el módulo 2 porque sin ella los
 * desafíos no pueden recibir casos de prueba, los operadores preceden a las
 * condiciones para no enseñar dos cosas a la vez, y las estructuras de la STL
 * llegan al final, cuando ya se entiende qué problema resuelven.
 */
export const cppFundamentos: Course = {
  slug: "cpp-fundamentos",
  title: "C++ Fundamentos",
  summary:
    "De cero a resolver tus primeros problemas: sintaxis, datos, control de flujo, funciones y las estructuras que usarás a diario.",
  description:
    "El punto de partida de BytePath. Empieza sin dar nada por sabido y termina con la base que necesitas para entrar en programación competitiva: leer la entrada, recorrer datos, decidir, repetir y apoyarte en la biblioteca estándar. Cada lección combina teoría breve, seis preguntas de comprobación y, cuando toca, un desafío que se compila y se ejecuta de verdad.",
  language: "C++",
  difficulty: "beginner",
  tags: ["Sintaxis", "Bases", "STL"],
  modules: [
    primerosPasos,
    entradaSalida,
    operadores,
    decisiones,
    bucles,
    funciones,
    colecciones,
    stlEsencial,
  ],
};
