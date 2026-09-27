"use client";

import { useRef, useState } from "react";
import type { QuizAnswerOutcome, RejectReason } from "@/lib/courses/outcomes";
import type { QuizSnapshot } from "@/lib/courses/quizProgress";
import type { PublicQuiz, PublicQuizQuestion } from "@/lib/courses/types";

/**
 * Máquina de estados del quiz de una lección. Aquí no hay JSX: los
 * componentes solo pintan lo que devuelve este hook.
 *
 * NO corrige. Las preguntas que llegan aquí no llevan la respuesta correcta
 * (ver `PublicQuiz`): al pulsar "Comprobar" se pregunta al servidor mediante
 * `onCheck`, que corrige, anota el acierto y contesta solo "acierto" o
 * "fallo". Este hook no puede saber si una respuesta es buena sin esa
 * respuesta; lo único que hace es llevar el orden, las rondas y el estado de
 * la pantalla. Quien quiera guardar el punto del quiz se engancha a
 * `onProgress` / `onFinish`.
 *
 * Reglas del flujo:
 * - El orden de las preguntas, y el de las opciones de cada una, se sortean
 *   una sola vez al montar el componente (un intento = una apertura del quiz)
 *   y no vuelven a cambiar durante ese intento.
 * - Se responde una pregunta a la vez. Al comprobar, la pregunta queda
 *   bloqueada en el acto —acierto o fallo— y solo se avanza con "Siguiente":
 *   no hay reintento inmediato de la misma pregunta.
 * - Una pregunta fallada no desaparece: se encola para el final de la ronda
 *   actual. Cuando la ronda se agota, la ronda siguiente son exactamente las
 *   preguntas pendientes, en el orden en que se fallaron. El quiz solo
 *   termina cuando no queda ninguna pregunta pendiente en ninguna ronda.
 *
 * Continuar donde se dejó:
 * - `initial` restaura un intento a medias: mismo orden de preguntas, mismas
 *   rondas y mismos aciertos y fallos. Lo único que no se restaura es la
 *   opción marcada en la pregunta que estaba en pantalla, que vuelve a
 *   aparecer sin responder.
 * - El progreso se anuncia SOLO al pasar a la pregunta siguiente (`next`).
 *   Ese es el único momento en que el estado es coherente por sí mismo: la
 *   pregunta actual está sin responder y las resueltas ya han salido de la
 *   ronda. Guardar también al comprobar obligaría a resolver el caso raro de
 *   "cerró con una pregunta corregida pero sin avanzar", y lo único que se
 *   pierde de no hacerlo es volver a contestar esa pregunta.
 */

export type AnswerState = {
  selected: string | null;
  /** Se ha pulsado "Comprobar" con la selección actual. */
  checked: boolean;
  solved: boolean;
  /** Se ha fallado al menos una vez, en cualquier ronda. Nunca se revierte. */
  failed: boolean;
  /** Explicación de la pregunta, que el servidor entrega solo al acertar. */
  explanation?: string;
};

export type QuestionProgress = "solved" | "solved-with-errors" | "current" | "pending";

const emptyAnswer: AnswerState = {
  selected: null,
  checked: false,
  solved: false,
  failed: false,
};

/** Barajado de Fisher-Yates: no hace falta más para reordenar en la UI. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Seed = {
  order: string[];
  optionOrders: Record<string, string[]>;
  currentRound: string[];
  nextRound: string[];
  roundTotal: number;
  roundNumber: number;
  answers: Record<string, AnswerState>;
};

/**
 * Estado con el que arranca un intento: nuevo, o restaurado de una
 * instantánea. Las opciones se rebarajan siempre; solo el orden de las
 * preguntas y el estado de las rondas se conservan.
 */
function createSeed(questions: PublicQuizQuestion[], initial: QuizSnapshot | null | undefined): Seed {
  const ids = questions.map((question) => question.id);
  const optionOrders: Record<string, string[]> = {};
  for (const question of questions) {
    optionOrders[question.id] = shuffle(question.options.map((option) => option.id));
  }

  const fresh = (): Seed => {
    const order = shuffle(ids);
    return {
      order,
      optionOrders,
      currentRound: [...order],
      nextRound: [],
      roundTotal: order.length,
      roundNumber: 1,
      answers: {},
    };
  };

  if (!initial) return fresh();

  const answers: Record<string, AnswerState> = {};
  for (const [id, result] of Object.entries(initial.results)) {
    answers[id] = { selected: null, checked: false, solved: result.solved, failed: result.failed };
  }

  // Defensa: una pregunta ya resuelta no puede seguir pendiente.
  const pending = (round: string[]) => round.filter((id) => !answers[id]?.solved);
  let currentRound = pending(initial.currentRound);
  let nextRound = pending(initial.nextRound);
  let roundNumber = initial.roundNumber;
  let roundTotal = initial.roundTotal;

  if (currentRound.length === 0 && nextRound.length > 0) {
    currentRound = nextRound;
    nextRound = [];
    roundNumber += 1;
    roundTotal = currentRound.length;
  }

  // Sin nada pendiente no hay nada que continuar: intento nuevo.
  if (currentRound.length === 0) return fresh();

  return {
    order: initial.order,
    optionOrders,
    currentRound,
    nextRound,
    roundTotal,
    roundNumber,
    answers,
  };
}

export function useLessonQuiz(
  quiz: PublicQuiz,
  {
    initial,
    onCheck,
    onProgress,
    onFinish,
  }: {
    /** Intento a medias que restaurar, ya validado contra este quiz. */
    initial?: QuizSnapshot | null;
    /** Corrige una respuesta en el servidor. */
    onCheck: (questionId: string, optionId: string) => Promise<QuizAnswerOutcome>;
    /** Se llama al pasar a la pregunta siguiente, con el punto exacto del quiz. */
    onProgress?: (snapshot: QuizSnapshot) => void;
    /** Se llama una sola vez, cuando el quiz termina. */
    onFinish?: () => void;
  },
) {
  const questions: PublicQuizQuestion[] = quiz.questions;
  const total = questions.length;

  // Se calcula una sola vez, al montar: la función de inicialización de
  // useState solo se ejecuta en el primer render, así que ni el orden ni las
  // opciones se reordenan en renders posteriores del mismo intento.
  const [seed] = useState(() => createSeed(questions, initial));
  const { order, optionOrders } = seed;

  const [currentRound, setCurrentRound] = useState<string[]>(seed.currentRound);
  const [nextRound, setNextRound] = useState<string[]>(seed.nextRound);
  const [roundTotal, setRoundTotal] = useState(seed.roundTotal);
  const [roundNumber, setRoundNumber] = useState(seed.roundNumber);

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(seed.answers);
  const [view, setView] = useState<"question" | "summary" | "review">("question");
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<RejectReason | "network" | null>(null);
  // Guarda síncrona: evita mandar la misma respuesta dos veces con un doble clic
  // antes de que React llegue a deshabilitar el botón.
  const checkInFlight = useRef(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const finished = currentRound.length === 0 && nextRound.length === 0;
  const displayedId = view === "review" ? order[reviewIndex] : currentRound[0];
  const current = questions.find((question) => question.id === displayedId) ?? questions[0];
  const answer = answers[current.id] ?? emptyAnswer;
  // Las opciones de `current` son exactamente las que se barajaron para su id,
  // así que el find siempre encuentra algo: el ! está justificado.
  const options = optionOrders[current.id].map(
    (optionId) => current.options.find((option) => option.id === optionId)!,
  );

  const positionInRound = roundTotal - currentRound.length + 1;

  const solvedCount = Object.values(answers).filter((state) => state.solved).length;
  const firstTryCount = Object.values(answers).filter(
    (state) => state.solved && !state.failed,
  ).length;

  // Si es la última pregunta pendiente en cualquier ronda y se acaba de
  // acertar, pulsar "Siguiente" termina el quiz. Solo cambia el rótulo del
  // botón: la lógica real de terminar vive en `next`.
  const isFinalStep =
    answer.checked && answer.solved && currentRound.length === 1 && nextRound.length === 0;

  function update(questionId: string, changes: Partial<AnswerState>) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? emptyAnswer), ...changes },
    }));
  }

  function select(optionId: string) {
    if (answer.checked) return; // bloqueada hasta que se avance con "Siguiente"
    update(current.id, { selected: optionId });
  }

  async function check() {
    if (!answer.selected || answer.checked || checkInFlight.current) return;
    checkInFlight.current = true;
    setChecking(true);
    setProblem(null);

    const questionId = current.id;
    const selected = answer.selected;

    try {
      const outcome = await onCheck(questionId, selected);

      if (outcome.status === "graded") {
        update(questionId, {
          checked: true,
          solved: outcome.correct,
          failed: answer.failed || !outcome.correct,
          explanation: outcome.explanation,
        });
      } else {
        // Sin veredicto del servidor no se avanza: la respuesta no cuenta y el
        // estudiante puede volver a pulsar "Comprobar".
        setProblem(outcome.reason);
      }
    } catch {
      setProblem("network");
    } finally {
      checkInFlight.current = false;
      setChecking(false);
    }
  }

  /** Punto exacto del quiz tras pasar de pregunta, listo para guardar. */
  function snapshotOf(
    nextCurrentRound: string[],
    nextNextRound: string[],
    number: number,
    roundSize: number,
  ): QuizSnapshot {
    const results: QuizSnapshot["results"] = {};
    for (const [id, state] of Object.entries(answers)) {
      if (state.solved || state.failed) results[id] = { solved: state.solved, failed: state.failed };
    }
    return {
      v: 1,
      order,
      currentRound: nextCurrentRound,
      nextRound: nextNextRound,
      roundNumber: number,
      roundTotal: roundSize,
      results,
    };
  }

  function next() {
    if (view !== "question" || !answer.checked) return;

    const wasCorrect = answer.solved;
    const restOfRound = currentRound.slice(1);
    const updatedNextRound = wasCorrect ? nextRound : [...nextRound, current.id];

    if (!wasCorrect) {
      // Se deja lista para su próximo encuentro: sin este reinicio, al
      // reaparecer en la siguiente ronda se vería bloqueada mostrando el
      // fallo de esta.
      update(current.id, { selected: null, checked: false });
    }

    if (restOfRound.length > 0) {
      setCurrentRound(restOfRound);
      setNextRound(updatedNextRound);
      onProgress?.(snapshotOf(restOfRound, updatedNextRound, roundNumber, roundTotal));
      return;
    }

    // Ronda actual agotada.
    if (updatedNextRound.length > 0) {
      setCurrentRound(updatedNextRound);
      setNextRound([]);
      setRoundTotal(updatedNextRound.length);
      setRoundNumber((value) => value + 1);
      onProgress?.(snapshotOf(updatedNextRound, [], roundNumber + 1, updatedNextRound.length));
      return;
    }

    // No queda ninguna pregunta pendiente en ninguna ronda: quiz terminado.
    // `currentRound` debe quedar vacío también en el estado, o `finished`
    // seguiría viendo la última pregunta ahí y bloquearía el repaso.
    setCurrentRound([]);
    setView("summary");
    onFinish?.();
  }

  /**
   * Entra en modo de repaso, de solo lectura. Solo tiene efecto una vez
   * terminado el quiz: en mitad de un intento, saltar de pregunta rompería el
   * orden de rondas y permitiría reintentar un fallo al instante.
   */
  function goTo(position: number) {
    if (!finished) return;
    setReviewIndex(Math.min(Math.max(0, position), total - 1));
    setView("review");
  }

  function exitReview() {
    setView("summary");
  }

  function progressOf(position: number): QuestionProgress {
    const state = answers[order[position]];
    if (state?.solved) return state.failed ? "solved-with-errors" : "solved";
    if (view === "question" && order[position] === current.id) return "current";
    return "pending";
  }

  return {
    view,
    current,
    answer,
    checking,
    problem,
    options,
    total,
    positionInRound,
    roundTotal,
    roundNumber,
    reviewIndex,
    isFinalStep,
    solvedCount,
    firstTryCount,
    select,
    check,
    next,
    goTo,
    exitReview,
    progressOf,
  };
}
