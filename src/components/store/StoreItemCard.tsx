import { Coins, Lock } from "lucide-react";
import { actionClass } from "@/components/ui/actions";
import { Badge } from "@/components/ui/Badge";
import type { StoreItem } from "@/lib/store/catalog";

/**
 * Tarjeta de un objeto de la tienda: nombre, descripción, precio en tokens,
 * disponibilidad y el botón de compra.
 *
 * El botón está deshabilitado SIEMPRE mientras no exista una compra real: no
 * finge una acción que no hace nada. Cuando exista, se conectará aquí a una
 * Server Action que llame a la función de compra de la base de datos (la que
 * decida precio y saldo), igual que la recarga de energía.
 *
 * `affordable` es solo para pintar ("te faltan N"): la comprobación de verdad
 * será la del servidor.
 */
export function StoreItemCard({ item, balance }: { item: StoreItem; balance: number | null }) {
  const affordable = balance !== null && balance >= item.price;
  const missing = balance === null ? null : Math.max(0, item.price - balance);

  return (
    <article className="flex flex-col rounded-panel border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">{item.name}</h3>
        {!item.available && <Badge tone="soon">Próximamente</Badge>}
      </div>
      <p className="mt-1.5 flex-1 text-dense leading-6 text-fg-muted">{item.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-brand-ink tabular-nums">
          <Coins aria-hidden className="size-4" />
          {item.price}
        </span>
        <button type="button" disabled className={actionClass("secondary", "sm")}>
          {!item.available ? (
            <>
              <Lock aria-hidden className="size-3.5" />
              No disponible
            </>
          ) : affordable || missing === null ? (
            "Comprar"
          ) : (
            `Te faltan ${missing}`
          )}
        </button>
      </div>
    </article>
  );
}
