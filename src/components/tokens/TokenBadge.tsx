"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerItemClass, isActivePath } from "@/components/layout/headerItem";
import { useAccountState } from "@/lib/energy/store";
import { routes } from "@/lib/site";
import { LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

/**
 * Saldo de tokens, junto al medidor de energía.
 *
 * Enlaza a /tienda: el sitio natural para "¿qué hago con mis tokens?" es donde
 * se gastan. La tienda enseña el mismo saldo, leído de la misma fuente
 * (`get_account_state`), así que la cifra de aquí y la de allí no pueden
 * discrepar.
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
  const active = isActivePath(usePathname(), routes.store);

  if (!state || !state.signedIn || state.tokens === null) return null;

  return (
    <Link
      href={routes.store}
      aria-label={`${state.tokens} tokens. Ir a la tienda.`}
      aria-current={active ? "page" : undefined}
      title={`${state.tokens} tokens · ganas ${LESSON_COMPLETION_REWARD} por lección completada`}
      className={headerItemClass(
        active,
        `gap-1.5 font-mono text-xs text-slate-300 tabular-nums ${className}`,
      )}
    >
      <Coins aria-hidden className="size-3.5 text-brand-300" />
      {state.tokens}
    </Link>
  );
}
