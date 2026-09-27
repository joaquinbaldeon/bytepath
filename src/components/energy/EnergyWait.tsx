"use client";

import { Loader2, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { EnergyBolts } from "@/components/energy/EnergyBolts";
import { FREE_MAX_ENERGY } from "@/lib/energy/config";
import { useAccountState } from "@/lib/energy/store";
import { useCountdown } from "@/lib/energy/useCountdown";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST } from "@/lib/tokens/config";
import { useEnergyRefill } from "@/lib/tokens/useEnergyRefill";

/**
 * "Necesitas 1 ⚡ para completar esta lección".
 *
 * Es lo que se ve cuando la lección está lista para completarse y a una cuenta
 * Free no le queda energía. No es un bloqueo de la lección —se puede seguir
 * leyendo y repasando, y sigue EN PROGRESO—, solo del último paso. Por eso el
 * tono es informativo, con dos cosas concretas: cuándo llega la próxima energía
 * (el instante lo da el servidor) y qué se puede hacer ahora (recargar con
 * tokens, o Premium, sin insistir).
 */
export function EnergyWait({ className = "" }: { className?: string }) {
  const account = useAccountState();
  const countdown = useCountdown(account?.nextEnergyAt ?? null);
  const { refill, refilling, notice } = useEnergyRefill();

  const limit = account?.limit ?? FREE_MAX_ENERGY;
  const remaining = account?.remaining ?? 0;
  const tokens = account?.tokens ?? null;
  const canRefill = tokens !== null && tokens >= ENERGY_REFILL_COST;

  return (
    <div
      role="status"
      className={`rounded-card border border-energy/40 bg-energy-soft px-4 py-3.5 text-left ${className}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-energy-ink">
        <Zap aria-hidden className="size-4 shrink-0 fill-current" />
        Necesitas 1 ⚡ para completar esta lección
      </p>
      <p className="mt-1 text-dense leading-5 text-fg-muted">
        Puedes seguir leyendo y repasando: la lección queda en progreso hasta que tengas energía.
      </p>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs text-fg-muted">
        <span className="inline-flex items-center gap-2">
          <EnergyBolts remaining={remaining} limit={limit} iconClassName="size-3.5" />
          <span className="tabular-nums">
            {remaining}/{limit}
          </span>
        </span>
        <span aria-hidden className="text-fg-subtle">
          ·
        </span>
        <span>{countdown ? `Próxima energía en ${countdown}` : "La energía se regenera sola"}</span>
      </p>

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {tokens !== null && (
          <button
            type="button"
            onClick={() => void refill()}
            disabled={!canRefill || refilling}
            aria-busy={refilling}
            className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control bg-energy px-3 text-dense font-medium text-ink transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
          >
            {refilling ? (
              <Loader2 aria-hidden className="size-3.5 animate-spin" />
            ) : (
              <Zap aria-hidden className="size-3.5 fill-current" />
            )}
            {canRefill
              ? `Recargar · ${ENERGY_REFILL_COST} 🪙`
              : `Recargar · faltan ${ENERGY_REFILL_COST - tokens} 🪙`}
          </button>
        )}
        <Link
          href={routes.premium}
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-dense font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <Sparkles aria-hidden className="size-3.5" />
          Conocer Premium
        </Link>
      </div>

      {notice && (
        <p className="mt-2 text-dense text-fg-muted" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  );
}
