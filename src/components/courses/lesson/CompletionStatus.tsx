"use client";

import { CircleCheck, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { EnergyBolts } from "@/components/energy/EnergyBolts";
import { EnergyWait } from "@/components/energy/EnergyWait";
import { TokenReward } from "@/components/tokens/TokenReward";
import type { CompleteRejectReason } from "@/lib/courses/outcomes";
import type { CompletionFeedback, LessonCompletion } from "@/lib/courses/useLessonCompletion";
import { FREE_MAX_ENERGY } from "@/lib/energy/config";
import { useAccountState, useOutOfEnergy } from "@/lib/energy/store";

const problemText: Partial<Record<CompleteRejectReason, string>> = {
  unavailable:
    "No se ha podido guardar tu progreso ahora mismo. Tu avance sigue aquí: inténtalo de nuevo en un momento.",
  quiz_pending: "Todavía falta terminar el quiz de esta lección.",
  challenge_pending: "Todavía falta resolver el desafío de esta lección.",
  locked: "Completa antes la lección anterior.",
  not_started: "La lección aún no está iniciada. Recarga la página e inténtalo de nuevo.",
  not_signed_in: "Inicia sesión para completar la lección.",
  not_found: "Esa lección ya no existe.",
  rate_limited: "Demasiadas acciones seguidas. Espera un momento e inténtalo de nuevo.",
};

/**
 * Lo que ha pasado al completar: los tokens ganados y la energía gastada, con
 * el rayo que se apaga. Se anima al aparecer (`bp-rise`, escalonado) y el
 * rayo mueve la transición de `n` a `n − 1`.
 */
export function CompletionChips({ feedback }: { feedback: CompletionFeedback }) {
  const account = useAccountState();
  const remaining = account?.remaining ?? null;
  const limit = account?.limit ?? FREE_MAX_ENERGY;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {feedback.amount > 0 && (
        <li className="bp-rise">
          <TokenReward amount={feedback.amount} />
        </li>
      )}
      {feedback.spent && remaining !== null ? (
        <li
          className="bp-rise inline-flex shrink-0 items-center gap-2 rounded-full bg-energy-soft px-3 py-1 text-dense font-medium whitespace-nowrap text-energy-ink"
          style={{ animationDelay: "120ms" }}
        >
          −1 ⚡
          <EnergyBolts remaining={remaining} from={remaining + 1} limit={limit} iconClassName="size-3" />
          <span className="font-mono tabular-nums">
            {remaining}/{limit}
          </span>
        </li>
      ) : (
        !feedback.spent && (
          <li
            className="bp-rise inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-dense font-medium whitespace-nowrap text-brand-ink"
            style={{ animationDelay: "120ms" }}
          >
            Premium · sin gastar ⚡
          </li>
        )
      )}
    </ul>
  );
}

/**
 * Cómo va el cierre de una lección: completada, completándose, sin energía o
 * con algún problema. Se usa en el resumen del quiz, en el resultado del
 * desafío y en la barra de la lección, para que digan lo mismo.
 *
 * `ready` es "todos los requisitos cumplidos y la lección sigue sin completar":
 * solo entonces tiene sentido avisar de que falta energía. Antes de eso —a mitad
 * de quiz— el aviso sería ruido, porque la energía se gasta al final.
 */
export function CompletionStatus({
  completion,
  ready,
  hideHeading = false,
  className = "",
}: {
  completion: LessonCompletion;
  ready: boolean;
  /** Omite el "Lección completada" cuando quien lo usa ya lo ha dicho en su título. */
  hideHeading?: boolean;
  className?: string;
}) {
  const outOfEnergy = useOutOfEnergy();
  const { completed, pending, feedback, problem, complete } = completion;

  if (completed) {
    return (
      <div className={`flex flex-col items-center gap-2.5 ${className}`}>
        {!hideHeading && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-practice-ink">
            <CircleCheck aria-hidden className="size-4" />
            Lección completada
          </p>
        )}
        {feedback && <CompletionChips feedback={feedback} />}
      </div>
    );
  }

  if (pending) {
    return (
      <p className={`inline-flex items-center justify-center gap-2 text-sm text-fg-muted ${className}`}>
        <Loader2 aria-hidden className="size-4 animate-spin" />
        Guardando tu progreso…
      </p>
    );
  }

  const noEnergy = problem === "no_energy" || (ready && outOfEnergy);

  if (noEnergy) return <EnergyWait className={className} />;

  if (problem) {
    return (
      <div
        role="alert"
        className={`rounded-card border border-hard/40 bg-danger-soft px-4 py-3 text-left ${className}`}
      >
        <p className="flex items-start gap-2 text-dense leading-5 text-danger-ink">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {problemText[problem] ?? problemText.unavailable}
        </p>
        <button
          type="button"
          onClick={() => void complete()}
          className="focus-ring mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-dense font-medium text-fg transition-colors hover:bg-surface-2"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  return null;
}
