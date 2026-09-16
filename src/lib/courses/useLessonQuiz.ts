"use client";

import { useState } from "react";
import { markLessonCompleted } from "@/lib/courses/progress";
import type { LessonQuiz, QuizQuestion } from "@/lib/courses/types";

/**
 * Máquina de estados del quiz de una lección. Aquí no hay JSX: los componentes
 * solo pintan lo que devuelve este hook.
 *
 * Reglas del flujo: se responde una pregunta a la vez; al comprobar se da
 * feedback inmediato; si se falla se puede reintentar; solo se avanza cuando la
 * pregunta está resuelta. Al resolver las seis, la lección queda completada.
 */

export type AnswerState = {
  selected: string | null;
  /** Se ha pulsado "Comprobar" con la selección actual. */
  checked: boolean;
  solved: boolean;
  /** Se ha fallado al menos una vez en esta pregunta. */
  failed: boolean;
};

export type QuestionProgress = "solved" | "solved-with-errors" | "current" | "pending";

const emptyAnswer: AnswerState = {
  selected: null,
  checked: false,
  solved: false,
  failed: false,
};

export function useLessonQuiz(
  quiz: LessonQuiz,
  {
    courseSlug,
    lessonSlug,
    completesLesson,
  }: {
    courseSlug: string;
    lessonSlug: string;
    /**
     * Falso cuando la lección tiene desafío: entonces el quiz es una etapa
     * intermedia y quien completa la lección es el desafío.
     */
    completesLesson: boolean;
  },
) {
  const questions: QuizQuestion[] = quiz.questions;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [view, setView] = useState<"question" | "summary">("question");

  const current = questions[index];
  const answer = answers[current.id] ?? emptyAnswer;

  const solvedCount = questions.filter((question) => answers[question.id]?.solved).length;
  const firstTryCount = questions.filter(
    (question) => answers[question.id]?.solved && !answers[question.id]?.failed,
  ).length;
  const isComplete = solvedCount === questions.length;
  const isLast = index === questions.length - 1;

  function update(questionId: string, changes: Partial<AnswerState>) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? emptyAnswer), ...changes },
    }));
  }

  function select(optionId: string) {
    if (answer.solved) return;
    update(current.id, { selected: optionId, checked: false });
  }

  function check() {
    if (!answer.selected || answer.solved) return;
    const correct = answer.selected === current.correctOptionId;
    update(current.id, { checked: true, solved: correct, failed: answer.failed || !correct });
  }

  function next() {
    if (!answers[current.id]?.solved) return;

    if (isLast) {
      if (completesLesson) {
        markLessonCompleted(courseSlug, lessonSlug);
      }
      setView("summary");
      return;
    }
    setIndex((value) => value + 1);
  }

  function goTo(target: number) {
    setIndex(Math.min(Math.max(0, target), questions.length - 1));
    setView("question");
  }

  function progressOf(position: number): QuestionProgress {
    const state = answers[questions[position].id];
    if (state?.solved) return state.failed ? "solved-with-errors" : "solved";
    if (position === index && view === "question") return "current";
    return "pending";
  }

  return {
    questions,
    index,
    current,
    answer,
    view,
    isLast,
    isComplete,
    solvedCount,
    firstTryCount,
    select,
    check,
    next,
    goTo,
    progressOf,
  };
}
