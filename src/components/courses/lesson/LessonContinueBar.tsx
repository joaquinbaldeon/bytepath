"use client";

import { ArrowRight, CircleCheck, Code, ListChecks, Loader2, Map as MapIcon, RotateCcw } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { CompletionChips } from "@/components/courses/lesson/CompletionStatus";
import { lessonFrame } from "@/components/courses/lesson/frame";
import { type LessonStep, LessonSteps } from "@/components/courses/lesson/LessonSteps";
import { actionClass } from "@/components/ui/actions";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { useAccountState, useOutOfEnergy } from "@/lib/energy/store";

export type ContinueMode =
  /** El quiz todavía no se ha empezado. */
  | { kind: "fresh" }
  /** Hay un quiz a medias que continuar. */
  | { kind: "resume"; solved: number; total: number }
  /** Quiz superado; falta el desafío. */
  | { kind: "quiz_passed" }
  /** Sin quiz, con desafío. */
  | { kind: "challenge_only" }
  /**
   * Todos los requisitos cumplidos y la lección sigue sin completar. Es el
   * estado de una lección solo de lectura (`readOnly`), y también al que se
   * vuelve cuando completar se rechazó por falta de energía.
   */
  | { kind: "ready"; readOnly: boolean }
  | { kind: "completed"; hasQuiz: boolean };

const primary = `${actionClass("primary")} sm:h-12 sm:px-6 sm:text-[15px]`;
const secondary = actionClass("secondary");

const arrow = (
  <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
);

/**
 * Barra fija al pie de la teoría: la acción principal de la lección en cada
 * momento, y encima los pasos (Teoría · Quiz · Desafío · Completar) para que
 * siempre se vea cuánto falta.
 *
 * Cada botón dice a dónde lleva ("Hacer el quiz", "Ir al desafío",
 * "Siguiente: Variables") en vez de un "Continuar" genérico. Lo que dice y
 * ofrece depende de en qué punto está la lección, que es justo lo que hace
 * falta al volver a ella: si el quiz ya está empezado, la barra lo dice y
 * ofrece continuarlo, no empezarlo otra vez. Reiniciar existe, pero es un
 * gesto en dos pasos: nadie debería perder un avance por un clic distraído.
 */
export function LessonContinueBar({
  mode,
  steps,
  completion,
  coursePath,
  next,
  busy,
  onOpenQuiz,
  onResetQuiz,
  onStartChallenge,
}: {
  mode: ContinueMode;
  steps: LessonStep[];
  completion: LessonCompletion;
  coursePath: string;
  next?: { title: string; href: string };
  /** Hay una petición al servidor en curso (reiniciar el quiz). */
  busy: boolean;
  onOpenQuiz: () => void;
  onResetQuiz: () => void;
  onStartChallenge: () => void;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const account = useAccountState();
  const outOfEnergy = useOutOfEnergy();
  // Cuesta 1 ⚡ solo a una cuenta Free con energía que medir.
  const costsEnergy = account !== null && account.signedIn && account.metered && !account.isPremium;

  let message: ReactNode;
  let actions: ReactNode;

  switch (mode.kind) {
    case "fresh":
      message = "Léela con calma. Cuando termines, un quiz corto para comprobar que se ha quedado.";
      actions = (
        <button type="button" onClick={onOpenQuiz} className={primary}>
          <ListChecks aria-hidden className="size-4" />
          Hacer el quiz
          {arrow}
        </button>
      );
      break;

    case "resume":
      message = (
        <>
          <span className="font-medium text-fg">Quiz a medias</span> · llevas {mode.solved} de{" "}
          {mode.total}. Sigue donde lo dejaste.
        </>
      );
      actions = confirmingReset ? (
        <>
          <button
            type="button"
            onClick={() => {
              setConfirmingReset(false);
              onResetQuiz();
            }}
            disabled={busy}
            className="focus-ring bp-press inline-flex h-11 items-center justify-center rounded-control border border-danger-ink/40 px-4 text-sm font-medium text-danger-ink transition-colors hover:bg-danger-soft disabled:opacity-60"
          >
            Sí, empezar de cero
          </button>
          <button type="button" onClick={() => setConfirmingReset(false)} className={secondary}>
            Mejor no
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setConfirmingReset(true)} className={secondary}>
            <RotateCcw aria-hidden className="size-4 text-fg-subtle" />
            Reiniciar
          </button>
          <button type="button" onClick={onOpenQuiz} className={primary}>
            Seguir con el quiz
            {arrow}
          </button>
        </>
      );
      break;

    case "quiz_passed":
    case "challenge_only":
      message =
        mode.kind === "quiz_passed" ? (
          <>
            <span className="inline-flex items-center gap-1.5 font-medium text-practice-ink">
              <CircleCheck aria-hidden className="size-4" />
              Quiz superado
            </span>{" "}
            · Ahora, a escribir código: el desafío cierra la lección.
          </>
        ) : (
          "Esta lección se cierra con un desafío: tu código se compila y se prueba de verdad."
        );
      actions = (
        <button type="button" onClick={onStartChallenge} className={primary}>
          <Code aria-hidden className="size-4" />
          Ir al desafío
          {arrow}
        </button>
      );
      break;

    case "ready":
      message = outOfEnergy ? (
        <>
          <span className="font-medium text-energy-ink">Todo hecho, pero te falta 1 ⚡ para cerrarla.</span>{" "}
          Tu avance está guardado: puedes seguir leyendo mientras vuelve.
        </>
      ) : mode.readOnly ? (
        "¿Leída? Márcala como terminada y se abre la siguiente."
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 font-medium text-practice-ink">
            <CircleCheck aria-hidden className="size-4" />
            Todo listo
          </span>{" "}
          · Complétala y se abre la siguiente.
        </>
      );
      actions = (
        <button
          key="complete"
          type="button"
          onClick={() => void completion.complete()}
          disabled={completion.pending || outOfEnergy}
          aria-busy={completion.pending}
          className={primary}
        >
          {completion.pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {completion.pending ? "Guardando…" : mode.readOnly ? "Terminar lección" : "Completar lección"}
          {costsEnergy && !outOfEnergy && !completion.pending && (
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-dense">−1 ⚡</span>
          )}
        </button>
      );
      break;

    case "completed":
      message = (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-practice-ink">
            <CircleCheck aria-hidden className="size-4" />
            {next ? "¡Hecha! Esta ya es tuya." : "¡Hecha! Has llegado al final del curso."}
          </span>
          {completion.feedback && <CompletionChips feedback={completion.feedback} />}
        </span>
      );
      actions = (
        <>
          {mode.hasQuiz && (
            <button key="review" type="button" onClick={onOpenQuiz} className={actionClass("quiet")}>
              Repasar quiz
            </button>
          )}
          <Link href={coursePath} className={next ? secondary : primary}>
            <MapIcon aria-hidden className="size-4" />
            Ver el camino
          </Link>
          {next && (
            <Link href={next.href} className={`${primary} max-w-full`} title={`Siguiente: ${next.title}`}>
              <span className="truncate">Siguiente: {next.title}</span>
              {arrow}
            </Link>
          )}
        </>
      );
      break;
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
      {/*
        Mismo marco que el contenido, así que la barra arranca y acaba donde él.
        Estrecho: pasos, mensaje y acciones apilados. Con sitio (desde 48rem de
        área): a la izquierda el progreso —los pasos y, debajo, qué toca— y a la
        derecha la acción principal, con su jerarquía.
      */}
      <div
        className={`${lessonFrame} flex flex-col gap-2.5 py-2.5 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-10 @3xl:py-4`}
      >
        <div className="min-w-0 space-y-2">
          <LessonSteps steps={steps} className="overflow-x-auto [scrollbar-width:none] @3xl:overflow-visible" />
          <div className="text-dense leading-5 text-fg-muted">{message}</div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:[&>*]:flex-1 @3xl:shrink-0 @3xl:justify-end">
          {actions}
        </div>
      </div>
    </div>
  );
}
