"use client";

import { ArrowRight, Code, Loader2, Map as MapIcon, Trophy } from "lucide-react";
import Link from "next/link";
import { CompletionStatus } from "@/components/courses/lesson/CompletionStatus";
import { actionClass } from "@/components/ui/actions";
import { Celebration } from "@/components/ui/Celebration";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useOutOfEnergy } from "@/lib/energy/store";

export type NextLesson = { slug: string; title: string; href: string };

/**
 * Resultado de un desafío resuelto.
 *
 * La acción principal es SIEMPRE lo siguiente que hay que hacer: completar la
 * lección si falta, la siguiente lección si ya está completada (con su nombre),
 * o el camino si era la última. "Seguir editando" queda como salida discreta
 * para quien quiera pulir su código.
 */
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
  const arrow = (
    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
  );

  return (
    // `m-auto` en el hijo, no `justify-center` en el padre: así se centra
    // cuando cabe y, cuando no cabe, se desplaza sin cortar la parte de arriba.
    <div className="flex h-full flex-col overflow-y-auto px-6 py-8">
      <div className="m-auto flex w-full flex-col items-center text-center">
        <Celebration icon={Trophy} />

        <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
          {attempts === 1 ? "¡A la primera! Desafío resuelto" : "¡Desafío resuelto!"}
        </h3>
        <p className="mt-2 max-w-sm leading-7 text-fg-muted">
          Tu salida coincide con la esperada
          {attempts === 1 ? "." : ` después de ${attempts} ejecuciones. Así es como se aprende.`}
          {!completed && ready ? " Solo te queda completar la lección." : ""}
          {!completed && !ready ? " Termina el quiz para poder completar la lección." : ""}
        </p>

        <div className="mt-4 w-full max-w-sm">
          <CompletionStatus completion={completion} ready={ready} />
        </div>

        <div className="mt-5 flex w-full max-w-sm flex-col items-stretch gap-2.5">
          {!completed && ready && !outOfEnergy && (
            <button
              type="button"
              onClick={() => void completion.complete()}
              disabled={pending}
              aria-busy={pending}
              className={actionClass("primary")}
            >
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              {pending ? "Guardando…" : "Completar lección"}
            </button>
          )}

          {completed && next && (
            <Link href={next.href} className={actionClass("primary")} title={`Siguiente: ${next.title}`}>
              <span className="truncate">Siguiente: {next.title}</span>
              {arrow}
            </Link>
          )}

          <Link href={coursePath} className={actionClass(completed && !next ? "primary" : "secondary")}>
            <MapIcon aria-hidden className="size-4" />
            Ver el camino
          </Link>

          <button type="button" onClick={onKeepEditing} className={actionClass("quiet", "sm")}>
            <Code aria-hidden className="size-4" />
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}
