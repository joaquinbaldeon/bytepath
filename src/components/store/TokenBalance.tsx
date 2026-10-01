"use client";

import { ArrowRight, Coins, DatabaseZap, Zap } from "lucide-react";
import Link from "next/link";
import { actionClass } from "@/components/ui/actions";
import { useLiveAccount } from "@/lib/energy/store";
import type { AccountState } from "@/lib/energy/types";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

/**
 * Saldo de tokens de la tienda.
 *
 * No lee nada por su cuenta: parte del estado que resolvió el servidor al
 * pedir la página (`get_account_state`) y se mantiene al día con el mismo
 * almacén que el contador de la cabecera, así que las dos cifras son la misma.
 */
export function TokenBalance({ initial }: { initial: AccountState }) {
  const account = useLiveAccount(initial);

  if (account.unavailable) {
    return (
      <div role="status" className="flex items-start gap-2 rounded-panel border border-line bg-surface p-5 text-dense text-energy-ink">
        <DatabaseZap aria-hidden className="mt-0.5 size-4 shrink-0" />
        No se ha podido leer tu saldo ahora mismo. Inténtalo de nuevo en un momento.
      </div>
    );
  }

  if (!account.signedIn) {
    return (
      <div className="rounded-panel border border-line bg-surface p-5 sm:p-6">
        <p className="font-display text-lg font-semibold">Tus tokens viven en tu cuenta</p>
        <p className="mt-1.5 text-dense leading-6 text-fg-muted">
          Entra para ver tu saldo. Ganas {LESSON_COMPLETION_REWARD} tokens por cada lección que
          completas.
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

  const tokens = account.tokens ?? 0;

  return (
    <div className="relative overflow-hidden rounded-panel border border-brand-400/35 bg-surface p-5 shadow-soft sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-brand-500/15 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-label text-fg-subtle">{"// tu saldo"}</p>
          <p className="mt-2 flex items-center gap-2.5">
            <Coins aria-hidden className="size-7 text-brand-ink" />
            <span className="font-display text-4xl font-semibold tabular-nums">{tokens}</span>
            <span className="text-dense text-fg-muted">tokens</span>
          </p>
          <p className="mt-2 text-dense text-fg-muted">
            +{LESSON_COMPLETION_REWARD} por cada lección que completas.
          </p>
        </div>

        <Link href={routes.account} className={`${actionClass("quiet", "sm")} self-start sm:self-auto`}>
          Ver tus movimientos
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {!account.isPremium && (
        <p className="relative mt-4 flex items-start gap-2 border-t border-line-soft pt-4 text-dense leading-6 text-fg-muted">
          <Zap aria-hidden className="mt-1 size-3.5 shrink-0 fill-energy text-energy" />
          <span>
            Mientras la tienda crece, tus tokens ya sirven para algo: con {ENERGY_REFILL_COST} llenas
            la energía sin esperar.{" "}
            <Link href={routes.energy} className="font-medium text-brand-ink hover:underline">
              Cómo funciona la energía
            </Link>
          </span>
        </p>
      )}
    </div>
  );
}
