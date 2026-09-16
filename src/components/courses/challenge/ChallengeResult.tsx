"use client";

import { ArrowRight, CircleCheck, Code } from "lucide-react";
import Link from "next/link";

export function ChallengeResult({
  attempts,
  nextHref,
  nextTitle,
  coursePath,
  onKeepEditing,
}: {
  attempts: number;
  nextHref?: string;
  nextTitle?: string;
  coursePath: string;
  onKeepEditing: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-practice-soft">
        <CircleCheck aria-hidden className="size-6 text-practice-ink" />
      </span>

      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
        ¡Desafío resuelto!
      </h3>
      <p className="mt-2 max-w-sm leading-7 text-fg-muted">
        La salida coincide con la esperada
        {attempts === 1 ? " a la primera." : ` tras ${attempts} ejecuciones.`} La lección queda
        completada.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {nextHref ? (
          <Link
            href={nextHref}
            className="group inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600"
          >
            Siguiente lección
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ) : (
          <Link
            href={coursePath}
            className="inline-flex h-11 items-center rounded-lg bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600"
          >
            Volver al curso
          </Link>
        )}

        <button
          type="button"
          onClick={onKeepEditing}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          <Code aria-hidden className="size-4" />
          Seguir editando
        </button>
      </div>

      {nextTitle && <p className="mt-3 text-sm text-fg-muted">A continuación: {nextTitle}</p>}
    </div>
  );
}
