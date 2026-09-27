"use client";

import { ArrowRight, CircleCheck, Code, Loader2, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { CompletionStatus } from "@/components/courses/lesson/CompletionStatus";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useOutOfEnergy } from "@/lib/energy/store";

export type NextLesson = { slug: string; title: string; href: string };

export function ChallengeResult({
  attempts,
  completion,
  ready,
  next,
  coursePath,
  onKeepEditing,
}: {
  attempts: number;
  /** Cómo va el cierre de la lección: aquí se ve si se ha completado, si falta energía... */
  completion: LessonCompletion;
  /** Quiz y desafío cumplidos, lección aún sin completar. */
  ready: boolean;
  next?: NextLesson;
  coursePath: string;
  onKeepEditing: () => void;
}) {
  const outOfEnergy = useOutOfEnergy();
  const { completed, pending } = completion;

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-practice-soft">
        <CircleCheck aria-hidden className="size-6 text-practice-ink" />
      </span>

      <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">¡Desafío resuelto!</h3>
      <p className="mt-2 max-w-sm leading-7 text-fg-muted">
        La salida coincide con la esperada
        {attempts === 1 ? " a la primera." : ` tras ${attempts} ejecuciones.`}
        {!completed && ready ? " Solo falta completar la lección." : ""}
        {!completed && !ready ? " Falta terminar el quiz para completar la lección." : ""}
      </p>

      <div className="mt-4 w-full max-w-sm">
        <CompletionStatus completion={completion} ready={ready} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {!completed && ready && !outOfEnergy && (
          <button
            type="button"
            onClick={() => void completion.complete()}
            disabled={pending}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-control bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            Completar lección
          </button>
        )}

        <Link
          href={coursePath}
          className={`focus-ring group inline-flex h-11 items-center gap-2 rounded-control px-5 font-medium transition-colors ${
            completed
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "border border-line text-sm hover:bg-surface-2"
          }`}
        >
          <MapIcon aria-hidden className="size-4" />
          Ver el camino
          {completed && (
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          )}
        </Link>

        <button
          type="button"
          onClick={onKeepEditing}
          className="focus-ring inline-flex h-11 items-center gap-2 rounded-control border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2"
        >
          <Code aria-hidden className="size-4" />
          Seguir editando
        </button>
      </div>

      {completed && next && (
        <Link
          href={next.href}
          className="focus-ring mt-3 inline-flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          Siguiente: {next.title}
        </Link>
      )}
    </div>
  );
}
