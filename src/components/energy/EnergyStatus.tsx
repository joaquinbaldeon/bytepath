"use client";

import { Coins, DatabaseZap, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { EnergyBolts } from "@/components/energy/EnergyBolts";
import { actionClass } from "@/components/ui/actions";
import { energyWord, FREE_MAX_ENERGY } from "@/lib/energy/config";
import { useLiveAccount } from "@/lib/energy/store";
import type { AccountState } from "@/lib/energy/types";
import { useCountdown } from "@/lib/energy/useCountdown";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST } from "@/lib/tokens/config";
import { useEnergyRefill } from "@/lib/tokens/useEnergyRefill";

/**
 * "Tu energía" de /energia: el estado de ahora, en grande.
 *
 * Todo sale de lo que ya existe: el estado que resolvió el servidor
 * (`get_account_state`), que se mantiene al día con el mismo almacén que el
 * medidor de la cabecera; la cuenta atrás de `useCountdown`; y la recarga de
 * `useEnergyRefill`, la misma acción que en el camino y en la lección. Aquí no
 * se calcula ni se decide nada: el límite es el que devuelve el servidor
 * (`FREE_MAX_ENERGY` solo es el respaldo mientras no llega).
 */
export function EnergyStatus({ initial }: { initial: AccountState }) {
  const account = useLiveAccount(initial);
  const countdown = useCountdown(account.isPremium ? null : account.nextEnergyAt);
  const { refill, refilling, notice } = useEnergyRefill();

  if (account.unavailable) {
    return (
      <div role="status" className="flex items-start gap-2 rounded-panel border border-line bg-surface p-5 text-dense text-energy-ink">
        <DatabaseZap aria-hidden className="mt-0.5 size-4 shrink-0" />
        No se ha podido leer tu energía ahora mismo. Inténtalo de nuevo en un momento.
      </div>
    );
  }

  if (!account.signedIn) {
    return (
      <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
        <p className="flex items-center gap-1" aria-hidden>
          {Array.from({ length: FREE_MAX_ENERGY }, (_, i) => (
            <Zap key={i} className="size-5 fill-energy text-energy" />
          ))}
        </p>
        <p className="mt-3 font-display text-lg font-semibold">
          Con una cuenta gratis tienes hasta {FREE_MAX_ENERGY} energías a la vez
        </p>
        <p className="mt-1.5 text-dense leading-6 text-fg-muted">
          Entra para ver cuántas te quedan y cuándo llega la próxima.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={routes.login} className={actionClass("primary", "sm")}>
            Iniciar sesión
          </Link>
          <Link href={routes.signup} className={actionClass("secondary", "sm")}>
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    );
  }

  const shell =
    "relative overflow-hidden rounded-panel border border-energy/40 bg-surface p-5 shadow-soft sm:p-6";
  const glow = (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-energy/15 blur-3xl"
    />
  );

  if (account.isPremium) {
    return (
      <div className={shell}>
        {glow}
        <p className="relative font-mono text-label text-fg-subtle">{"// tu energía"}</p>
        <p className="relative mt-2 flex items-center gap-3">
          <Zap aria-hidden className="size-8 fill-energy text-energy" />
          <span className="font-display text-5xl leading-none font-semibold text-brand-ink">∞</span>
        </p>
        <p className="relative mt-3 text-dense text-fg-muted">
          Tienes Premium: completar lecciones no gasta energía y nunca tienes que esperar.
        </p>
      </div>
    );
  }

  const limit = account.limit ?? FREE_MAX_ENERGY;
  const remaining = account.remaining ?? 0;
  const tokens = account.tokens ?? 0;
  const isFull = remaining >= limit;
  const canRefill = !isFull && tokens >= ENERGY_REFILL_COST;

  return (
    <div className={shell}>
      {glow}
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-label text-fg-subtle">{"// tu energía"}</p>
          <p className="mt-2 flex flex-wrap items-center gap-4">
            <EnergyBolts remaining={remaining} limit={limit} iconClassName="size-7" />
            <span className="font-display text-4xl font-semibold tabular-nums">
              <span className="sr-only">
                {remaining} {energyWord(remaining)} de {limit}
              </span>
              <span aria-hidden>
                ⚡ {remaining}
                <span className="text-2xl text-fg-subtle"> / {limit}</span>
              </span>
            </span>
          </p>
          <p className="mt-3 text-dense text-fg-muted">
            {isFull
              ? `A tope: puedes completar ${limit} lecciones seguidas.`
              : remaining === 0
                ? countdown
                  ? `Sin energía por ahora. Vuelve 1 en ${countdown}.`
                  : "Sin energía por ahora. Se regenera sola."
                : countdown
                  ? `La próxima llega en ${countdown}.`
                  : "Se regenera sola."}
          </p>
        </div>

        {!isFull && (
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <button
              type="button"
              onClick={() => void refill()}
              disabled={!canRefill || refilling}
              aria-busy={refilling}
              className={actionClass("energy")}
            >
              {refilling ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Zap aria-hidden className="size-4 fill-current" />
              )}
              Llenar la energía
              <span className="inline-flex items-center gap-1 rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-label tabular-nums">
                <Coins aria-hidden className="size-3" />
                {canRefill ? ENERGY_REFILL_COST : `faltan ${ENERGY_REFILL_COST - tokens}`}
              </span>
            </button>
            <p className="text-label text-fg-subtle">
              Tienes <span className="font-mono tabular-nums">{tokens}</span> tokens
            </p>
          </div>
        )}
      </div>

      {notice && (
        <p role="status" className="relative mt-3 text-dense text-fg-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
