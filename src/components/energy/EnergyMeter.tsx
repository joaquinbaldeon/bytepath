"use client";

import { TriangleAlert, Zap } from "lucide-react";
import Link from "next/link";
import { EnergyBolts } from "@/components/energy/EnergyBolts";
import { energyWord, FREE_MAX_ENERGY } from "@/lib/energy/config";
import { useAccountState } from "@/lib/energy/store";
import { useCountdown } from "@/lib/energy/useCountdown";
import { routes } from "@/lib/site";

/**
 * Medidor de energía de la barra superior.
 *
 * Vive donde ya está la cuenta —la barra de navegación y la cabecera de la
 * lección—, que son las dos superficies oscuras del producto. Por eso los
 * colores son fijos y no del tema: aquí el fondo siempre es `night-900`.
 *
 * Es un enlace a /premium a propósito. El límite se explica solo cuando se ve
 * bajar, y el sitio natural para preguntar "¿y si no quiero límite?" es el
 * propio medidor; así no hace falta un banner que lo recuerde.
 *
 * No se renderiza nada sin sesión: sin cuenta no hay energía que medir, y un
 * medidor a cero para quien no ha entrado sería mentira.
 */
export function EnergyMeter({ className = "" }: { className?: string }) {
  const state = useAccountState();
  // Cuenta atrás puramente decorativa: ver useCountdown para por qué esto no
  // es la fuente de verdad de ningún cálculo.
  const countdown = useCountdown(state?.isPremium ? null : (state?.nextEnergyAt ?? null));

  if (!state || !state.signedIn) return null;

  if (state.unavailable) {
    return (
      <span
        role="status"
        title="No se ha podido leer tu energía ahora mismo."
        className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-energy ${className}`}
      >
        <TriangleAlert aria-hidden className="size-4" />
        <span className="hidden sm:inline">Energía no disponible</span>
      </span>
    );
  }

  const base = `focus-ring inline-flex items-center gap-2 rounded-control px-2 py-1.5 transition-colors hover:bg-white/5 ${className}`;

  if (state.isPremium) {
    return (
      <Link
        href={routes.premium}
        aria-label="Energía ilimitada con Premium"
        title="Premium · energía ilimitada"
        className={base}
      >
        <Zap aria-hidden className="size-4 fill-energy text-energy" />
        {/* El símbolo va en su propio span para poder darle el tamaño que
            necesita: a 14px el infinito casi no se lee. */}
        <span aria-hidden className="text-base leading-none font-semibold text-brand-300">
          ∞
        </span>
      </Link>
    );
  }

  const limit = state.limit ?? FREE_MAX_ENERGY;
  const remaining = state.remaining ?? 0;

  const label =
    remaining === 0
      ? "Sin energía. Conoce Premium o recarga con tokens."
      : `Tienes ${remaining} ${energyWord(remaining)} de ${limit}.`;

  return (
    <Link href={routes.premium} aria-label={label} title={label} className={base}>
      {/* Debajo de `sm` no caben seis rayos junto al nombre sin apretar la
          barra, así que ahí el mismo dato se da en cifra. */}
      <span aria-hidden className="flex items-center gap-1 sm:hidden">
        <Zap className={`size-4 ${remaining > 0 ? "fill-energy text-energy" : "text-white/35"}`} />
        <span className="font-mono text-xs tabular-nums text-slate-300">
          {remaining}/{limit}
        </span>
      </span>

      <EnergyBolts
        remaining={remaining}
        limit={limit}
        tone="dark"
        iconClassName="size-3.5"
        className="hidden sm:flex"
      />

      {/* Solo aparece si falta alguna y hay una próxima confirmada: quien
          está al tope no necesita ver una cuenta atrás. */}
      {countdown && remaining < limit && (
        <span aria-hidden className="hidden font-mono text-[11px] text-slate-400 lg:inline">
          Próxima energía en {countdown}
        </span>
      )}
    </Link>
  );
}
