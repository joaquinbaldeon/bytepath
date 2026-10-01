"use client";

import { Coins, DatabaseZap, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { EnergyBolts } from "@/components/energy/EnergyBolts";
import { RailSection } from "@/components/ui/RailCard";
import { FREE_MAX_ENERGY } from "@/lib/energy/config";
import { useLiveAccount } from "@/lib/energy/store";
import { useCountdown } from "@/lib/energy/useCountdown";
import type { AccountState } from "@/lib/energy/types";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";
import { useEnergyRefill } from "@/lib/tokens/useEnergyRefill";

/**
 * Energía y tokens junto al camino, SIN caja.
 *
 * Es el sitio donde el estudiante entiende de un vistazo cuánto puede avanzar
 * ahora: seis rayos, cuántos quedan y cuándo llega el siguiente ("Próxima
 * energía en 2h 14m"). Aparece dos veces según el ancho —como sección del raíl
 * en pantallas grandes y como línea compacta encima del camino en móvil— porque
 * en móvil el raíl cae debajo de un camino larguísimo y la energía tendría que
 * buscarse al final.
 *
 * Recuerda la regla del sistema en una línea: entrar es gratis, completar cuesta
 * 1 ⚡. Si el servidor no responde, no se esconde: se dice.
 */
export function EnergyPanel({
  initial,
  variant,
}: {
  initial: AccountState;
  variant: "rail" | "strip";
}) {
  const account = useLiveAccount(initial);
  const countdown = useCountdown(account.isPremium ? null : account.nextEnergyAt);
  const { refill, refilling, notice } = useEnergyRefill();

  if (account.unavailable) {
    return (
      <p
        role="status"
        className="flex items-start gap-2 text-dense leading-5 text-energy-ink"
      >
        <DatabaseZap aria-hidden className="mt-0.5 size-4 shrink-0" />
        No se ha podido leer tu energía ahora mismo. El resto del curso sigue disponible.
      </p>
    );
  }

  if (!account.signedIn || !account.metered) return null;

  const limit = account.limit ?? FREE_MAX_ENERGY;
  const remaining = account.remaining ?? 0;
  const tokens = account.tokens ?? 0;
  const isFull = remaining >= limit;
  const canRefill = !account.isPremium && !isFull && tokens >= ENERGY_REFILL_COST;
  const missing = Math.max(0, ENERGY_REFILL_COST - tokens);

  const bolts = account.isPremium ? (
    <span className="inline-flex items-center gap-1.5">
      <Zap aria-hidden className="size-5 fill-energy text-energy" />
      <span aria-hidden className="text-lg leading-none font-semibold text-brand-ink">
        ∞
      </span>
    </span>
  ) : (
    <EnergyBolts remaining={remaining} limit={limit} iconClassName="size-4 sm:size-[1.125rem]" />
  );

  const figure = account.isPremium ? "∞" : `${remaining}/${limit}`;
  const spoken = account.isPremium ? "Energía ilimitada" : `${remaining} de ${limit} energías`;

  const next = account.isPremium
    ? "Con Premium no esperas ni gastas nada."
    : isFull
      ? `A tope: puedes completar ${limit} lecciones seguidas.`
      : remaining === 0
        ? countdown
          ? `Sin energía por ahora · vuelve 1 en ${countdown}`
          : "Sin energía por ahora · se regenera sola"
        : countdown
          ? `+1 en ${countdown}`
          : "Se regenera sola.";

  const refillButton = !account.isPremium && !isFull && (
    <button
      type="button"
      onClick={() => void refill()}
      disabled={!canRefill || refilling}
      aria-busy={refilling}
      className="focus-ring bp-press inline-flex h-9 items-center justify-center gap-1.5 rounded-control bg-energy px-3 text-dense font-medium text-ink transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
    >
      {refilling ? (
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <Zap aria-hidden className="size-3.5 fill-current" />
      )}
      Llenar la energía
      <span className="inline-flex items-center gap-1 rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-label tabular-nums">
        <Coins aria-hidden className="size-3" />
        {canRefill ? ENERGY_REFILL_COST : `faltan ${missing}`}
      </span>
    </button>
  );

  if (variant === "strip") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line-soft py-3">
        <span className="flex items-center gap-2.5">
          {bolts}
          <span className="sr-only">{spoken}.</span>
          {!account.isPremium && (
            <span aria-hidden className="font-mono text-xs font-medium text-fg tabular-nums">
              {figure}
            </span>
          )}
        </span>
        <span className="text-dense text-fg-muted">{next}</span>
        <Link
          href={routes.account}
          className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-control font-mono text-xs text-fg-muted tabular-nums hover:text-fg"
        >
          <Coins aria-hidden className="size-3.5 text-brand-ink" />
          {tokens}
        </Link>
        {refillButton && <div className="w-full sm:w-auto">{refillButton}</div>}
        {notice && (
          <p role="status" className="w-full text-dense text-fg-muted">
            {notice}
          </p>
        )}
      </div>
    );
  }

  return (
    <RailSection title="Energía y tokens" icon={Zap}>
      <div className="flex items-center justify-between gap-3">
        {bolts}
        <span className="font-mono text-sm font-semibold text-fg tabular-nums">
          <span className="sr-only">{spoken}</span>
          <span aria-hidden>{figure}</span>
        </span>
      </div>
      <p className="mt-2 text-dense text-fg-muted">{next}</p>
      <p className="mt-1.5 text-label leading-4 text-fg-subtle">
        Entrar y estudiar es gratis. Completar una lección cuesta 1 ⚡.
      </p>

      <div className="mt-3.5 border-t border-line-soft pt-3">
        <Link
          href={routes.account}
          className="focus-ring inline-flex items-center gap-1.5 rounded-control text-dense text-fg-muted hover:text-fg"
        >
          <Coins aria-hidden className="size-3.5 text-brand-ink" />
          <span className="font-mono font-medium text-fg tabular-nums">{tokens}</span> tokens
        </Link>
        {!account.isPremium && (
          <p className="mt-1 text-label leading-4 text-fg-subtle">
            Ganas {LESSON_COMPLETION_REWARD} por lección. Con {ENERGY_REFILL_COST} llenas la energía
            sin esperar.
          </p>
        )}
      </div>

      {refillButton && <div className="mt-3 flex flex-col">{refillButton}</div>}
      {notice && (
        <p role="status" className="mt-2 text-dense text-fg-muted">
          {notice}
        </p>
      )}
    </RailSection>
  );
}
