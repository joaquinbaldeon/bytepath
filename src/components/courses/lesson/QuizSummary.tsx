"use client";

import { ArrowRight, Code, Loader2, Map as MapIcon, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { CompletionStatus } from "@/components/courses/lesson/CompletionStatus";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useOutOfEnergy } from "@/lib/energy/store";

export type QuizNextLesson = { slug: string; title: string; href: string };

const primary =
  "focus-ring group inline-flex h-12 items-center justify-center gap-2 rounded-control bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2";

export function QuizSummary({
  total,
  firstTryCount,
  completion,
  completesLesson,
  isModuleReview,
  next,
  coursePath,
  challengeAvailable,
  onStartChallenge,
  onReview,
  onClose,
}: {
  total: number;
  firstTryCount: number;
  /** Cómo va el cierre de la lección. Solo interesa cuando el quiz es el último requisito. */
  completion: LessonCompletion;
  completesLesson: boolean;
  isModuleReview: boolean;
  next?: QuizNextLesson;
  coursePath: string;
  challengeAvailable: boolean;
  onStartChallenge: () => void;
  onReview: () => void;
  onClose: () => void;
}) {
  const outOfEnergy = useOutOfEnergy();
  const done = completesLesson && completion.completed;
  const waiting = completesLesson && !completion.completed;

  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-practice-soft">
        <Trophy aria-hidden className="size-7 text-practice-ink" />
      </span>

      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
        {done
          ? isModuleReview
            ? "¡Módulo repasado!"
            : "¡Lección completada!"
          : "¡Quiz superado!"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm leading-7 text-fg-muted">
        Has resuelto las {total} preguntas
        {firstTryCount === total
          ? ", todas a la primera. Impecable."
          : `, ${firstTryCount} de ellas a la primera.`}
      </p>

      {completesLesson && (
        <div className="mx-auto mt-5 max-w-sm">
          <CompletionStatus completion={completion} ready={waiting} hideHeading />
        </div>
      )}

      {challengeAvailable ? (
        <>
          <p className="mx-auto mt-4 max-w-sm leading-7 text-fg-muted">
            Ahora toca aplicarlo escribiendo código. La lección no se marcará como completada
            hasta que resuelvas el desafío.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <button type="button" onClick={onStartChallenge} className={primary}>
              <Code aria-hidden className="size-4" />
              Resolver desafío
            </button>

            <Link href={coursePath} className={secondary}>
              <MapIcon aria-hidden className="size-4 text-fg-subtle" />
              Volver al camino
            </Link>
          </div>
        </>
      ) : done ? (
        <div className="mt-7 flex flex-col gap-2.5">
          <Link href={coursePath} className={primary}>
            <MapIcon aria-hidden className="size-4" />
            Ver el camino
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>

          {next && (
            <Link href={next.href} className={secondary}>
              {isModuleReview ? "Siguiente módulo" : "Siguiente lección"}: {next.title}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-2.5">
          {!completion.pending && !outOfEnergy && (
            <button type="button" onClick={() => void completion.complete()} className={primary}>
              Completar lección
            </button>
          )}
          {completion.pending && (
            <button type="button" disabled className={primary}>
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Completando…
            </button>
          )}
          <button type="button" onClick={onClose} className={secondary}>
            Volver a la lección
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onReview}
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <RotateCcw aria-hidden className="size-4" />
        Repasar las preguntas
      </button>
    </div>
  );
}
