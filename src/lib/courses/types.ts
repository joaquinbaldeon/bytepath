// Estructuras de datos del contenido educativo.
//
// Todo son objetos planos y serializables, pensados para poder migrarse tal cual
// a una base de datos más adelante: cada entidad se identifica por su `slug` y el
// orden lo define la posición dentro del array.

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type LessonKind = "theory" | "exercise" | "quiz";

/* ---------------------------------- Bloques --------------------------------- */
/* Bloques de teoría: solo alimentan el panel izquierdo de la lección.           */

export type ParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type HeadingBlock = {
  type: "heading";
  text: string;
};

export type ListBlock = {
  type: "list";
  items: string[];
  ordered?: boolean;
};

export type CodeSample = {
  type: "code";
  code: string;
  /** Rótulo del bloque, por ejemplo el nombre del archivo. */
  caption?: string;
  /** Salida del programa, si conviene mostrarla. */
  output?: string;
};

export type Callout = {
  type: "callout";
  variant: "tip" | "warning" | "key";
  title?: string;
  text: string;
};

export type TraceStep = {
  /** Línea del código que se resalta en este paso (empezando en 1). */
  line: number;
  explanation: string;
  variables?: { name: string; value: string }[];
  output?: string;
};

/** Ejemplo interactivo: recorre un fragmento de código paso a paso. */
export type CodeTrace = {
  type: "trace";
  title?: string;
  code: string;
  steps: TraceStep[];
};

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | CodeSample
  | Callout
  | CodeTrace;

/* ----------------------------------- Quiz ----------------------------------- */

/**
 * Tipo de pregunta. Todas se responden igual (una opción entre varias), así que
 * un único componente las pinta todas: `kind` solo cambia el rótulo y el énfasis
 * que se le da al código.
 */
export type QuestionKind =
  | "concept"
  | "what-does-it-do"
  | "predict-output"
  | "spot-error"
  | "apply";

export type QuizQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** Fragmento de código sobre el que se pregunta. */
  code?: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
};

/**
 * Cada quiz tiene exactamente seis preguntas. La tupla lo garantiza en tiempo de
 * compilación: si escribes cinco o siete, el build falla en vez de descubrirse
 * en pantalla.
 */
export type SixQuestions = [
  QuizQuestion,
  QuizQuestion,
  QuizQuestion,
  QuizQuestion,
  QuizQuestion,
  QuizQuestion,
];

export type LessonQuiz = {
  questions: SixQuestions;
};

/**
 * Pregunta tal como llega al navegador: SIN la respuesta correcta ni la
 * explicación. Corregir es cosa del servidor (`checkQuizAnswerAction`); si la
 * respuesta viajara en las props, "el quiz lo corrige el servidor" sería solo
 * una frase, porque cualquiera la leería en las herramientas del navegador y
 * el quiz —que es el requisito para completar la lección— se saltaría.
 */
export type PublicQuizQuestion = Omit<QuizQuestion, "correctOptionId" | "explanation">;

export type PublicQuiz = {
  questions: PublicQuizQuestion[];
};

export function toPublicQuiz(quiz: LessonQuiz): PublicQuiz {
  return {
    questions: quiz.questions.map((question) => ({
      id: question.id,
      kind: question.kind,
      prompt: question.prompt,
      ...(question.code === undefined ? {} : { code: question.code }),
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
    })),
  };
}

/* -------------------------------- Desafío ---------------------------------- */

export type ChallengeExample = {
  input?: string;
  output: string;
  explanation?: string;
};

/**
 * Parte **pública** de un desafío: todo esto llega al navegador, y debe llegar,
 * porque es lo que el estudiante necesita leer.
 *
 * Los casos de prueba, la salida esperada y la solución viven en
 * `src/server/challenges/tests.ts`, que nunca se serializa al cliente. La
 * salida esperada tiene que ser determinista: el enunciado debe fijar los
 * valores ("usa 17") o el programa debe leerlos de `stdin`.
 */
export type PracticalChallenge = {
  id: string;
  title: string;
  /** Enunciado en bloques: reutiliza el mismo renderizado que la teoría. */
  statement: ContentBlock[];
  instructions: string[];
  requirements?: string[];
  examples?: ChallengeExample[];
  /** Pistas opcionales: se revelan de una en una, a petición. */
  hints?: string[];
  starterCode: string;
};

/* --------------------------------- Entidades -------------------------------- */

export type Lesson = {
  slug: string;
  title: string;
  kind: LessonKind;
  estimatedMinutes: number;
  summary?: string;
  /** Teoría del panel izquierdo. Vacío = contenido pendiente de escribir. */
  blocks: ContentBlock[];
  /** Quiz del panel derecho. `null` = quiz pendiente de escribir. */
  quiz: LessonQuiz | null;
  /**
   * Tercera etapa, después del quiz. `null` en las lecciones conceptuales, que
   * se completan al terminar las seis preguntas.
   */
  challenge: PracticalChallenge | null;
};

export type Module = {
  slug: string;
  title: string;
  summary?: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  title: string;
  /** Descripción breve para la tarjeta del listado. */
  summary: string;
  /** Descripción larga para la página del curso. */
  description: string;
  language: string;
  difficulty: Difficulty;
  tags?: string[];
  modules: Module[];
};
