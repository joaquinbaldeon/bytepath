"use client";

import { Coins, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { FREE_MAX_ENERGY } from "@/lib/energy/config";
import { patchAccountState } from "@/lib/energy/store";
import { useCountdown } from "@/lib/energy/useCountdown";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";
import { refillEnergyAction } from "@/lib/tokens/actions";

/**
 * Tarjeta interactiva de /cuenta: energía, tokens y el botón de recarga.
 *
 * Recibe el estado inicial ya resuelto por el servidor (para que la página
 * no arranque en blanco) y a partir de ahí gestiona su propio estado local,
 * igual que hace `EnergyPanel` en el camino. Cualquier
 * recarga que ocurra aquí también se publica al almacén global, para que el
 * medidor de la barra se entere sin recargar la página.
 */
export function EconomyCard({
  isPremium,
  initialRemaining,
  initialLimit,
  initialTokens,
  initialNextEnergyAt,
}: {
  isPremium: boolean;
  initialRemaining: number | null;
  initialLimit: number | null;
  initialTokens: number | null;
  initialNextEnergyAt: string | null;
}) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [tokens, setTokens] = useState(initialTokens);
  const [nextEnergyAt, setNextEnergyAt] = useState(initialNextEnergyAt);
  const [refilling, setRefilling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // El tope real lo da el servidor (`get_account_state`); `FREE_MAX_ENERGY`
  // es solo el respaldo mientras no hay dato, igual que en EnergyMeter.
  const limit = initialLimit ?? FREE_MAX_ENERGY;
  const countdown = useCountdown(isPremium ? null : nextEnergyAt);
  const canRefill = !isPremium && tokens !== null && tokens >= ENERGY_REFILL_COST;
  const isFull = !isPremium && remaining !== null && remaining >= limit;

  async function handleRefill() {
    setRefilling(true);
    setNotice(null);
    try {
      const outcome = await refillEnergyAction();
      if (outcome.refilled) {
        setRemaining(outcome.remaining);
        setTokens(outcome.tokens);
        setNextEnergyAt(outcome.nextEnergyAt);
        patchAccountState({
          remaining: outcome.remaining,
          tokens: outcome.tokens,
          nextEnergyAt: outcome.nextEnergyAt,
        });
        setNotice("Energía recargada al máximo.");
      } else {
        if (outcome.tokens !== null) {
          setTokens(outcome.tokens);
          patchAccountState({ tokens: outcome.tokens });
        }
        setNotice(
          outcome.reason === "energy_full"
            ? "Ya tienes la energía al máximo."
            : "No tienes tokens suficientes todavía.",
        );
      }
    } finally {
      setRefilling(false);
    }
  }

  return (
    <div className="rounded-panel border border-line bg-surface p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Energía */}
        <div>
          <p className="flex items-center gap-2 font-mono text-label tracking-wider text-fg-subtle uppercase">
            <Zap aria-hidden className="size-3.5" />
            Energía
          </p>

          {isPremium ? (
            <p className="mt-2 font-display text-3xl font-semibold text-brand-ink">∞</p>
          ) : (
            <>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold tabular-nums">
                  {remaining ?? 0}
                </span>
                <span className="text-dense text-fg-muted">de {limit}</span>
              </p>
              <p className="mt-1 text-dense text-fg-muted">
                {isFull ? "Al máximo." : countdown ? `+1 en ${countdown}.` : "Se regenera sola."}
              </p>
            </>
          )}
        </div>

        {/* Tokens */}
        <div>
          <p className="flex items-center gap-2 font-mono text-label tracking-wider text-fg-subtle uppercase">
            <Coins aria-hidden className="size-3.5" />
            Tokens
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{tokens ?? 0}</p>
          <p className="mt-1 text-dense text-fg-muted">+{LESSON_COMPLETION_REWARD} por cada lección que completas.</p>
        </div>
      </div>

      {!isPremium && (
        <div className="mt-6 border-t border-line pt-5">
          <button
            type="button"
            onClick={handleRefill}
            disabled={!canRefill || isFull || refilling}
            aria-busy={refilling}
            className="focus-ring inline-flex h-11 items-center gap-2 rounded-control bg-energy px-5 font-medium text-ink transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
          >
            {refilling ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Zap aria-hidden className="size-4 fill-current" />
            )}
            {isFull
              ? "Energía al máximo"
              : canRefill
                ? `Recargar energía · ${ENERGY_REFILL_COST} 🪙`
                : `Necesitas ${Math.max(0, ENERGY_REFILL_COST - (tokens ?? 0))} 🪙 más`}
          </button>

          {notice && (
            <p role="status" className="mt-2.5 text-dense text-fg-muted">
              {notice}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
