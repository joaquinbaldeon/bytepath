import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Tarjeta del raíl lateral.
 *
 * Es la unidad del raíl: cada bloque de apoyo es una de estas. Que todas
 * compartan borde, radio y ritmo interno es lo que hace que el raíl se lea
 * como una sola cosa en vez de como piezas sueltas apiladas.
 */
export function RailCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 ${className}`}>
      {title && (
        <h2 className="flex items-center gap-2 font-mono text-label tracking-wider text-fg-subtle uppercase">
          {Icon && <Icon aria-hidden className="size-3.5" />}
          {title}
        </h2>
      )}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

/** Fila de dato: etiqueta a la izquierda, valor a la derecha. */
export function RailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-dense">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium text-fg tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Sección del raíl SIN caja: sin borde, sin relleno, sin radio. Solo un título
 * en mayúsculas de HUD con un filete que se extiende hasta el borde, y el
 * contenido debajo. Es lo que se usa junto al camino de aprendizaje, que no
 * vive en un panel: un raíl hecho de tarjetas al lado de un camino sin caja
 * volvería a meter paneles donde se acaban de quitar.
 */
export function RailSection({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title && (
        <h2 className="flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.18em] text-fg-subtle uppercase">
          {Icon && <Icon aria-hidden className="size-3.5" />}
          {title}
          <span aria-hidden className="h-px flex-1 bg-line" />
        </h2>
      )}
      <div className={title ? "mt-3.5" : ""}>{children}</div>
    </section>
  );
}
