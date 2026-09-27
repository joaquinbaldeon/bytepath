"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useAccountState } from "@/lib/energy/store";
import { routes } from "@/lib/site";

/**
 * Saldo de tokens, junto al medidor de energía.
 *
 * Enlaza a /cuenta —el resumen de la economía de la cuenta— y no a /premium:
 * el sitio natural para "¿qué hago con mis tokens?" es el propio saldo, no la
 * página de ventas.
 *
 * Mismo criterio que `EnergyMeter`: sin sesión no se pinta nada, y mientras
 * el estado no ha llegado tampoco, para no mostrar un cero que no es de
 * nadie todavía.
 */
export function TokenBadge({
  className = "inline-flex",
}: {
  /**
   * Controla si se muestra y cómo se dispone (`inline-flex`, `hidden
   * sm:flex`...). No lleva un valor por defecto fijo A LA VEZ que uno en la
   * plantilla: `inline-flex` puesto aquí y otro puesto ahí competirían por la
   * misma propiedad sin que ganara el previsible.
   */
  className?: string;
}) {
  const state = useAccountState();

  if (!state || !state.signedIn || state.tokens === null) return null;

  return (
    <Link
      href={routes.account}
      aria-label={`${state.tokens} tokens. Ver tu cuenta.`}
      title={`${state.tokens} tokens`}
      className={`focus-ring items-center gap-1.5 rounded-control px-2 py-1.5 font-mono text-xs text-slate-300 tabular-nums transition-colors hover:bg-white/5 hover:text-white ${className}`}
    >
      <Coins aria-hidden className="size-3.5 text-brand-300" />
      {state.tokens}
    </Link>
  );
}
