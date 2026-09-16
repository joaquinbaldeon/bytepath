import type { Course } from "@/lib/courses/types";

/**
 * Contenido del curso "Introducción a la Programación Competitiva".
 * Igual que el resto de cursos: solo datos, editables sin tocar componentes.
 */
export const introProgramacionCompetitiva: Course = {
  slug: "introduccion-programacion-competitiva",
  title: "Introducción a la Programación Competitiva",
  summary:
    "Cómo funciona un concurso, cómo leer un problema y cómo saber si tu solución entra en el tiempo límite.",
  description:
    "Resolver problemas de concurso no es solo programar: es leer un enunciado con precisión, estimar si tu idea es lo bastante rápida y escribirla sin errores. Este curso cubre esas tres habilidades antes de entrar en algoritmos concretos.",
  language: "C++",
  difficulty: "intermediate",
  tags: ["Concursos", "Complejidad"],
  modules: [
    {
      slug: "como-funciona-un-concurso",
      title: "Cómo funciona un concurso",
      summary: "Las reglas del juego: enunciados, veredictos y límites.",
      lessons: [
        {
          slug: "que-es-la-programacion-competitiva",
          title: "¿Qué es la programación competitiva?",
          kind: "theory",
          estimatedMinutes: 7,
          summary:
            "Qué se te pide exactamente en un problema de concurso y en qué se diferencia de programar en el día a día.",
          blocks: [
            {
              type: "paragraph",
              text: "En un concurso recibes un enunciado con unas reglas muy concretas: un formato de entrada, un formato de salida y unos límites. Tu programa lee datos por la entrada estándar, calcula la respuesta y la escribe por la salida estándar. Un juez automático lo ejecuta con casos de prueba ocultos y decide si es correcto.",
            },
            {
              type: "callout",
              variant: "key",
              title: "Dos restricciones, no una",
              text: "Una solución vale si da la respuesta correcta y además termina dentro del tiempo límite. Un programa correcto pero lento recibe el mismo veredicto negativo que uno equivocado.",
            },
            {
              type: "heading",
              text: "Veredictos habituales",
            },
            {
              type: "list",
              items: [
                "Aceptado: la salida coincide con la esperada en todos los casos de prueba.",
                "Respuesta incorrecta: tu programa termina, pero la salida no es la esperada en algún caso.",
                "Límite de tiempo excedido: la solución es demasiado lenta para los límites del problema.",
                "Error de ejecución: el programa termina de forma anómala, por ejemplo al salirse de un vector.",
              ],
            },
            {
              type: "paragraph",
              text: "La consecuencia práctica es que conviene estimar el coste de tu idea antes de escribirla. Si los límites dicen que hay hasta un millón de datos, una solución que compara todos los pares no va a entrar en tiempo, por muy correcta que sea.",
            },
            {
              type: "callout",
              variant: "warning",
              title: "Los ejemplos del enunciado no bastan",
              text: "Los casos que ves en el enunciado son pequeños y están para que entiendas el formato. El juez prueba con casos ocultos, grandes y con situaciones límite: acertar los ejemplos no garantiza nada.",
            },
          ],
          quiz: {
            questions: [
              {
                id: "pc-1",
                kind: "concept",
                prompt: "¿Qué se evalúa en un problema de concurso?",
                options: [
                  { id: "a", text: "Solo que la respuesta sea correcta." },
                  { id: "b", text: "Que la respuesta sea correcta y que además entre en el tiempo límite." },
                  { id: "c", text: "Que el código sea corto y legible." },
                ],
                correctOptionId: "b",
                explanation:
                  "El estilo no puntúa y la corrección por sí sola no basta: el tiempo es parte del enunciado.",
              },
              {
                id: "pc-2",
                kind: "concept",
                prompt:
                  "Tu programa acierta en los ejemplos, pero el juez responde Límite de tiempo excedido. ¿Qué significa?",
                options: [
                  { id: "a", text: "Que la lógica está mal y hay que rehacerla desde cero." },
                  {
                    id: "b",
                    text: "Que la solución es correcta pero demasiado lenta para los límites del problema.",
                  },
                  { id: "c", text: "Que el programa no compila." },
                ],
                correctOptionId: "b",
                explanation:
                  "Ese veredicto habla de velocidad, no de corrección: hace falta un algoritmo de menor coste, no necesariamente otra idea.",
              },
              {
                id: "pc-3",
                kind: "apply",
                prompt:
                  "El enunciado dice que hay hasta 200.000 datos y el límite es 1 segundo. Tu idea compara cada dato con todos los demás. ¿Qué esperas del juez?",
                options: [
                  { id: "a", text: "Aceptado, porque la idea es correcta." },
                  { id: "b", text: "Límite de tiempo excedido: son demasiadas comparaciones." },
                  { id: "c", text: "Error de ejecución." },
                ],
                correctOptionId: "b",
                explanation:
                  "Comparar todos los pares de 200.000 datos son unas 20.000 millones de operaciones: muy por encima de lo que cabe en un segundo.",
              },
              {
                id: "pc-4",
                kind: "spot-error",
                prompt:
                  "«Si mi programa acierta los ejemplos del enunciado, será aceptado». ¿Qué falla en ese razonamiento?",
                options: [
                  {
                    id: "a",
                    text: "Los casos de prueba reales están ocultos y son más grandes y exigentes.",
                  },
                  { id: "b", text: "Nada: los ejemplos son los mismos casos que usa el juez." },
                  { id: "c", text: "Que los ejemplos del enunciado suelen estar mal." },
                ],
                correctOptionId: "a",
                explanation:
                  "Los ejemplos sirven para entender el formato. Los casos ocultos son los que deciden, e incluyen situaciones límite.",
              },
              {
                id: "pc-5",
                kind: "concept",
                prompt: "¿Qué suele indicar un veredicto de Error de ejecución?",
                options: [
                  { id: "a", text: "Que la salida no coincide con la esperada." },
                  {
                    id: "b",
                    text: "Que el programa terminó de forma anómala, por ejemplo al salirse de un vector.",
                  },
                  { id: "c", text: "Que el programa tardó demasiado." },
                ],
                correctOptionId: "b",
                explanation:
                  "Accesos fuera de rango, divisiones por cero o memoria agotada son las causas más habituales.",
              },
              {
                id: "pc-6",
                kind: "apply",
                prompt: "Acabas de leer un problema. ¿Qué conviene hacer antes de escribir código?",
                options: [
                  {
                    id: "a",
                    text: "Estimar cuántas operaciones hará tu idea con los límites del enunciado.",
                  },
                  { id: "b", text: "Escribir la primera idea y enviarla para ver qué dice el juez." },
                  { id: "c", text: "Optimizar la lectura de datos antes que nada." },
                ],
                correctOptionId: "a",
                explanation:
                  "Los límites del enunciado te dicen qué coste puedes permitirte. Descubrirlo después de escribir cuesta mucho más tiempo.",
              },
            ],
          },
          challenge: null,
        },
        {
          slug: "anatomia-de-un-problema",
          title: "Anatomía de un problema",
          kind: "theory",
          estimatedMinutes: 8,
          blocks: [],
          quiz: null,
          challenge: null,
        },
        {
          slug: "entrada-y-salida-rapida",
          title: "Entrada y salida rápida",
          kind: "theory",
          estimatedMinutes: 9,
          blocks: [],
          quiz: null,
          challenge: null,
        },
        {
          slug: "quiz-concursos",
          title: "Repaso del módulo",
          kind: "quiz",
          estimatedMinutes: 6,
          blocks: [],
          quiz: null,
          challenge: null,
        },
      ],
    },
    {
      slug: "complejidad",
      title: "Complejidad",
      summary: "Estimar si una idea entra en el tiempo límite antes de escribirla.",
      lessons: [
        {
          slug: "notacion-big-o",
          title: "Notación Big-O",
          kind: "theory",
          estimatedMinutes: 10,
          blocks: [],
          quiz: null,
          challenge: null,
        },
        {
          slug: "estimar-operaciones",
          title: "Estimar operaciones",
          kind: "exercise",
          estimatedMinutes: 10,
          blocks: [],
          quiz: null,
          challenge: null,
        },
        {
          slug: "quiz-complejidad",
          title: "Repaso del módulo",
          kind: "quiz",
          estimatedMinutes: 6,
          blocks: [],
          quiz: null,
          challenge: null,
        },
      ],
    },
  ],
};
