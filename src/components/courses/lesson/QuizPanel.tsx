"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { QuizProgressDots } from "@/components/courses/lesson/QuizProgressDots";
import { QuizQuestionCard } from "@/components/courses/lesson/QuizQuestionCard";
import { QuizSummary, type QuizNextLesson } from "@/components/courses/lesson/QuizSummary";
import type { QuizAnswerOutcome } from "@/lib/courses/outcomes";
import type { QuizSnapshot } from "@/lib/courses/quizProgress";
import type { PublicQuiz } from "@/lib/courses/types";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useLessonQuiz } from "@/lib/courses/useLessonQuiz";

export type QuizPanelProps = {
  quiz: PublicQuiz;
  /** Intento a medias que continuar, o `null` para empezar de cero. */
  initial: QuizSnapshot | null;
  isModuleReview: boolean;
  /** Cómo va el cierre de la lección (la lleva el espacio de trabajo). */
  completion: LessonCompletion;
  /** El quiz es el último requisito: superarlo completa la lección. */
  completesLesson: boolean;
  challengeAvailable: boolean;
  coursePath: string;
  next?: QuizNextLesson;
  /** Corrige una respuesta en el servidor. */
  onCheck: (questionId: string, optionId: string) => Promise<QuizAnswerOutcome>;
  /** Cierra el quiz para volver a la teoría. */
  onClose: () => void;
  /** Punto del quiz tras cada pregunta: quien lo recibe decide si lo guarda. */
  onProgress: (snapshot: QuizSnapshot) => void;
  onFinish: () => void;
  onStartChallenge: () => void;
};

/**
 * Contenido del quiz, pensado para vivir dentro del modal (`QuizModal`).
 *
 * No sabe nada de energía ni de acceso: para llegar aquí la lección ya se ha
 * iniciado, y esa comprobación es del servidor, en la página de la lección.
 * Tampoco sabe guardar nada: avisa de su progreso y de su final por los
 * callbacks, y el espacio de trabajo de la lección decide qué hacer con ellos.
 *
 * Es el cuerpo de un modal, no una página: ocupa el alto que el modal le da
 * (`min-h-0` + zona central con scroll propio) y la barra de abajo se queda
 * siempre a la vista, que es donde está el botón que se pulsa una y otra vez.
 */
export function QuizPanel({
  quiz,
  initial,
  isModuleReview,
  completion,
  completesLesson,
  challengeAvailable,
  coursePath,
  next: nextLesson,
  onCheck,
  onClose,
  onProgress,
  onFinish,
  onStartChallenge,
}: QuizPanelProps) {
  const {
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
    view,
    isFinalStep,
    solvedCount,
    firstTryCount,
    select,
    check,
    next,
    goTo,
    exitReview,
    progressOf,
  } = useLessonQuiz(quiz, { initial, onCheck, onProgress, onFinish });

  const headerLabel =
    view === "summary"
      ? "Resultado"
      : view === "review"
        ? `Repaso · pregunta ${reviewIndex + 1} de ${total}`
        : roundNumber === 1
          ? `Pregunta ${positionInRound} de ${roundTotal}`
          : `Repaso · pregunta ${positionInRound} de ${roundTotal}`;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line-soft px-5 py-3 sm:px-6">
        <p className="text-sm font-semibold">{headerLabel}</p>
        <QuizProgressDots total={total} progressOf={progressOf} onSelect={goTo} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
        {view === "summary" ? (
          <QuizSummary
            total={total}
            firstTryCount={firstTryCount}
            completion={completion}
            completesLesson={completesLesson}
            isModuleReview={isModuleReview}
            next={nextLesson}
            coursePath={coursePath}
            challengeAvailable={challengeAvailable}
            onClose={onClose}
            onStartChallenge={onStartChallenge}
            onReview={() => goTo(0)}
          />
        ) : (
          <>
            <QuizQuestionCard question={current} answer={answer} options={options} onSelect={select} />
            {problem && (
              <p role="alert" className="mt-4 text-dense text-danger-ink">
                {problem === "not_signed_in"
                  ? "Tu sesión ha caducado. Inicia sesión de nuevo para guardar tus respuestas."
                  : problem === "locked"
                    ? "Completa antes la lección anterior."
                    : problem === "rate_limited"
                      ? "Demasiadas respuestas seguidas. Espera un momento y vuelve a comprobar."
                      : "No se ha podido guardar tu respuesta. Inténtalo de nuevo."}
              </p>
            )}
          </>
        )}
      </div>

      {view === "question" && (
        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-surface px-5 py-3.5 sm:px-6">
          <p className="font-mono text-xs text-fg-subtle">
            {solvedCount}/{total} resueltas
          </p>

          {answer.checked ? (
            <button
              type="button"
              onClick={next}
              className="focus-ring group inline-flex h-11 items-center gap-2 rounded-control bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600"
            >
              {isFinalStep ? "Terminar" : "Siguiente pregunta"}
              <ChevronRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void check()}
              disabled={!answer.selected || checking}
              aria-busy={checking}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-control bg-fg px-5 font-medium text-canvas transition-colors hover:bg-fg/90 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
            >
              {checking && <Loader2 aria-hidden className="size-4 animate-spin" />}
              Comprobar
            </button>
          )}
        </footer>
      )}

      {view === "review" && (
        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line bg-surface px-5 py-3.5 sm:px-6">
          <p className="font-mono text-xs text-fg-subtle">Repasando tus respuestas</p>
          <button
            type="button"
            onClick={exitReview}
            className="focus-ring inline-flex h-11 items-center rounded-control border border-line px-5 font-medium transition-colors hover:bg-surface-2"
          >
            Volver al resultado
          </button>
        </footer>
      )}
    </>
  );
}
