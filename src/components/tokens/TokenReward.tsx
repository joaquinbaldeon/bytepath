import { Coins } from "lucide-react";

/**
 * Aviso breve de que se han ganado tokens al completar una lección.
 *
 * Vive junto al mensaje de éxito que ya existía ("¡Lección completada!",
 * "¡Desafío resuelto!"): no es un segundo momento de celebración, es un dato
 * más de ese mismo momento. Sin animación: una insignia quieta, no un
 * confeti.
 */
export function TokenReward({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-dense font-medium text-brand-ink">
      <Coins aria-hidden className="size-3.5" />+{amount}
    </span>
  );
}
