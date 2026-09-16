"use client";

import { ChevronRight, ListChecks } from "lucide-react";
import { QuizProgressDots } from "@/components/courses/lesson/QuizProgressDots";
import { QuizQuestionCard } from "@/components/courses/lesson/QuizQuestionCard";
import { QuizSummary } from "@/components/courses/lesson/QuizSummary";
import type { LessonQuiz } from "@/lib/courses/types";
import { useLessonQuiz } from "@/lib/courses/useLessonQuiz";

export type QuizPanelProps = {
  quiz: LessonQuiz;
  courseSlug: string;
  lessonSlug: string;
  isModuleReview: boolean;
  coursePath: string;
  nextHref?: string;
  nextTitle?: string;
  completesLesson: boolean;
  challengeAvailable: boolean;
  onStartChallenge: () => void;
};

export function QuizPanel({
  quiz,
  courseSlug,
  lessonSlug,
  isModuleReview,
  coursePath,
  nextHref,
  nextTitle,
  completesLesson,
  challengeAvailable,
  onStartChallenge,
}: QuizPanelProps) {
  const {
    questions,
    index,
    current,
    answer,
    view,
    isLast,
    solvedCount,
    firstTryCount,
    select,
    check,
    next,
    goTo,
    progressOf,
  } = useLessonQuiz(quiz, { courseSlug, lessonSlug, completesLesson });

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-7">
        <div className="flex items-center gap-2.5">
          <ListChecks aria-hidden className="size-4.5 text-learn-ink" />
          <p className="text-sm font-semibold">
            {view === "summary" ? "Resultado" : `Pregunta ${index + 1} de ${questions.length}`}
          </p>
        </div>
        <QuizProgressDots total={questions.length} progressOf={progressOf} onSelect={goTo} />
      </header>

      <div className="flex-1 px-5 py-6 sm:px-7">
        {view === "summary" ? (
          <QuizSummary
            total={questions.length}
            firstTryCount={firstTryCount}
            isModuleReview={isModuleReview}
            nextHref={nextHref}
            nextTitle={nextTitle}
            coursePath={coursePath}
            challengeAvailable={challengeAvailable}
            onStartChallenge={onStartChallenge}
            onReview={() => goTo(0)}
          />
        ) : (
          <QuizQuestionCard question={current} answer={answer} onSelect={select} />
        )}
      </div>

      {view === "question" && (
        <footer className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-line bg-surface/90 px-5 py-4 backdrop-blur sm:px-7">
          <p className="font-mono text-xs text-fg-subtle">
            {solvedCount}/{questions.length} resueltas
          </p>

          {answer.solved ? (
            <button
              type="button"
              onClick={next}
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600"
            >
              {isLast ? "Terminar" : "Siguiente pregunta"}
              <ChevronRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={check}
              disabled={!answer.selected}
              className="inline-flex h-11 items-center rounded-lg bg-fg px-5 font-medium text-canvas transition-colors hover:bg-fg/90 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
            >
              Comprobar
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
