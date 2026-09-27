"use client";

import { ArrowRight, CircleCheck, Code, Loader2, Map as MapIcon, RotateCcw } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { CompletionChips } from "@/components/courses/lesson/CompletionStatus";
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

const primary =
  "focus-ring group inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60";
const secondary =
  "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line px-4 text-sm font-medium transition-colors hover:bg-surface-2";

/**
 * Barra fija al pie de la teoría: el "Continuar" que lleva al quiz y, al final,
 * el "Completar lección" que es donde se gasta la energía.
 *
 * Lo que dice y ofrece depende de en qué punto está la lección, que es
 * justo lo que hace falta al volver a ella: si el quiz ya está empezado, la
 * barra lo dice ("Pregunta 4 de 6") y ofrece continuarlo, no empezarlo otra
 * vez. Reiniciar existe, pero es un gesto en dos pasos: nadie debería perder
 * un avance por un clic distraído.
 */
export function LessonContinueBar({
  mode,
  completion,
  coursePath,
  next,
  busy,
  onOpenQuiz,
  onResetQuiz,
  onStartChallenge,
}: {
  mode: ContinueMode;
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
      message = "Cuando la hayas leído, comprueba lo aprendido con un quiz de seis preguntas.";
      actions = (
        <button type="button" onClick={onOpenQuiz} className={primary}>
          Continuar
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      );
      break;

    case "resume":
      message = (
        <>
          <span className="font-medium text-fg">Quiz en curso</span> · {mode.solved} de {mode.total} resueltas
        </>
      );
      actions = (
        <>
          {confirmingReset ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setConfirmingReset(false);
                  onResetQuiz();
                }}
                disabled={busy}
                className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-danger-ink/40 px-4 text-sm font-medium text-danger-ink transition-colors hover:bg-danger-soft disabled:opacity-60"
              >
                Sí, borrar mi avance
              </button>
              <button type="button" onClick={() => setConfirmingReset(false)} className={secondary}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirmingReset(true)} className={secondary}>
                <RotateCcw aria-hidden className="size-4 text-fg-subtle" />
                Reiniciar
              </button>
              <button type="button" onClick={onOpenQuiz} className={primary}>
                Continuar quiz
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </>
          )}
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
            · Falta el desafío para completar la lección.
          </>
        ) : (
          "Esta lección se completa con un desafío práctico."
        );
      actions = (
        <button type="button" onClick={onStartChallenge} className={primary}>
          <Code aria-hidden className="size-4" />
          Resolver desafío
        </button>
      );
      break;

    case "ready":
      message = outOfEnergy ? (
        <span className="font-medium text-energy-ink">Necesitas 1 ⚡ para completar esta lección.</span>
      ) : mode.readOnly ? (
        "Cuando termines de leer, termínala para desbloquear la siguiente."
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 font-medium text-practice-ink">
            <CircleCheck aria-hidden className="size-4" />
            Todo listo
          </span>{" "}
          · Completa la lección para desbloquear la siguiente.
        </>
      );
      actions = (
        <button
          type="button"
          onClick={() => void completion.complete()}
          disabled={completion.pending || outOfEnergy}
          aria-busy={completion.pending}
          className={primary}
        >
          {completion.pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {mode.readOnly ? "Terminar lección" : "Completar lección"}
          {costsEnergy && !outOfEnergy && (
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
            Lección completada
          </span>
          {completion.feedback && <CompletionChips feedback={completion.feedback} />}
        </span>
      );
      actions = (
        <>
          {mode.hasQuiz && (
            <button type="button" onClick={onOpenQuiz} className={secondary}>
              Repasar quiz
            </button>
          )}
          <Link href={coursePath} className={next ? secondary : `${primary} group`}>
            <MapIcon aria-hidden className="size-4" />
            Ver el camino
          </Link>
          {next && (
            <Link href={next.href} className={`${primary} group`} title={next.title}>
              Siguiente lección
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </>
      );
      break;
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="text-dense leading-5 text-fg-muted">{message}</div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      </div>
    </div>
  );
}
