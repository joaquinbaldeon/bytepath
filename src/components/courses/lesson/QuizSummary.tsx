"use client";

import { ArrowRight, Code, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";

export function QuizSummary({
  total,
  firstTryCount,
  isModuleReview,
  nextHref,
  nextTitle,
  coursePath,
  challengeAvailable,
  onStartChallenge,
  onReview,
}: {
  total: number;
  firstTryCount: number;
  isModuleReview: boolean;
  nextHref?: string;
  nextTitle?: string;
  coursePath: string;
  challengeAvailable: boolean;
  onStartChallenge: () => void;
  onReview: () => void;
}) {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-practice-soft">
        <Trophy aria-hidden className="size-7 text-practice-ink" />
      </span>

      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
        {challengeAvailable
          ? "¡Quiz superado!"
          : isModuleReview
            ? "¡Módulo repasado!"
            : "¡Lección completada!"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm leading-7 text-fg-muted">
        Has resuelto las {total} preguntas
        {firstTryCount === total
          ? ", todas a la primera. Impecable."
          : `, ${firstTryCount} de ellas a la primera.`}
      </p>

      {challengeAvailable ? (
        <>
          <p className="mx-auto mt-4 max-w-sm leading-7 text-fg-muted">
            Ahora toca aplicarlo escribiendo código. La lección no se marcará como completada
            hasta que resuelvas el desafío.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onStartChallenge}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Code aria-hidden className="size-4" />
              Resolver desafío
            </button>

            {nextHref && (
              <Link
                href={nextHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                Saltar por ahora
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="mt-8 flex flex-col gap-2.5">
          {nextHref ? (
            <Link
              href={nextHref}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600"
            >
              {isModuleReview ? "Siguiente módulo" : "Siguiente lección"}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ) : (
            <Link
              href={coursePath}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-500 px-6 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Volver al curso
            </Link>
          )}

          {nextTitle && <p className="text-sm text-fg-muted">A continuación: {nextTitle}</p>}
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
