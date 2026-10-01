"use client";

import { ArrowRight, Code, Flag, Loader2, Map as MapIcon, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { CompletionStatus } from "@/components/courses/lesson/CompletionStatus";
import { actionClass } from "@/components/ui/actions";
import { Celebration } from "@/components/ui/Celebration";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useOutOfEnergy } from "@/lib/energy/store";

export type QuizNextLesson = { slug: string; title: string; href: string };

const primary = actionClass("primary", "lg");
const secondary = actionClass("secondary");

/**
 * Cierre del quiz. Como en el resultado del desafío, la acción principal es
 * lo siguiente que toca: el desafío si lo hay, completar si falta, o la
 * siguiente lección —con su nombre— si ya está completada.
 */
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
  const perfect = firstTryCount === total;
  const arrow = (
    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
  );

  return (
    <div className="text-center">
      <Celebration icon={isModuleReview ? Flag : Trophy} size="lg" />

      <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">
        {done
          ? isModuleReview
            ? "¡Módulo superado!"
            : "¡Lección completada!"
          : "¡Quiz superado!"}
      </h2>
      <p className="mx-auto mt-3 max-w-sm leading-7 text-fg-muted">
        {perfect
          ? `${total} de ${total} a la primera. Impecable.`
          : `Has resuelto las ${total}, ${firstTryCount} a la primera. Las que fallaste ya las tienes más claras.`}
      </p>

      {completesLesson && (
        <div className="mx-auto mt-5 max-w-sm">
          <CompletionStatus completion={completion} ready={waiting} hideHeading />
        </div>
      )}

      {challengeAvailable ? (
        <>
          <p className="mx-auto mt-4 max-w-sm leading-7 text-fg-muted">
            Ahora, a escribir código: la lección se completa cuando resuelvas el desafío.
          </p>

          <div className="mt-8 flex flex-col gap-2.5">
            <button type="button" onClick={onStartChallenge} className={primary}>
              <Code aria-hidden className="size-4" />
              Ir al desafío
              {arrow}
            </button>

            <Link href={coursePath} className={secondary}>
              <MapIcon aria-hidden className="size-4 text-fg-subtle" />
              Volver al camino
            </Link>
          </div>
        </>
      ) : done ? (
        <div className="mt-7 flex flex-col gap-2.5">
          {next ? (
            <>
              <Link href={next.href} className={primary} title={next.title}>
                <span className="truncate">
                  {isModuleReview ? "Siguiente módulo" : "Siguiente"}: {next.title}
                </span>
                {arrow}
              </Link>
              <Link href={coursePath} className={secondary}>
                <MapIcon aria-hidden className="size-4 text-fg-subtle" />
                Ver el camino
              </Link>
            </>
          ) : (
            <Link href={coursePath} className={primary}>
              <MapIcon aria-hidden className="size-4" />
              Ver el camino
              {arrow}
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
              Guardando…
            </button>
          )}
          <button type="button" onClick={onClose} className={secondary}>
            Volver a la lección
          </button>
        </div>
      )}

      <button type="button" onClick={onReview} className={`mt-4 ${actionClass("quiet", "sm")}`}>
        <RotateCcw aria-hidden className="size-4" />
        Repasar las preguntas
      </button>
    </div>
  );
}
