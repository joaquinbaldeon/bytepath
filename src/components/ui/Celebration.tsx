import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

/**
 * El icono de un momento de éxito (lección completada, desafío resuelto),
 * con seis chispas que salen una sola vez.
 *
 * Reutiliza `bp-burst`, las mismas chispas que marcan en el camino el nodo al
 * que toca ir: aquí en verde de "aceptado". Es deliberadamente pequeño —un
 * gesto, no un confeti— y con prefers-reduced-motion se queda solo el icono.
 */
export function Celebration({
  icon: Icon,
  tone = "practice",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: "practice" | "brand";
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-12 rounded-2xl";
  const glyph = size === "lg" ? "size-7" : "size-6";
  const soft = tone === "practice" ? "bg-practice-soft text-practice-ink" : "bg-brand-soft text-brand-ink";
  const spark = tone === "practice" ? "bg-practice" : "bg-brand-400";

  return (
    <span className="relative mx-auto grid place-items-center">
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`bp-burst absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full ${spark}`}
          style={{ "--a": `${i * 60 + 30}deg` } as CSSProperties}
        />
      ))}
      <span className={`bp-celebrate relative grid place-items-center ${box} ${soft}`}>
        <Icon aria-hidden className={glyph} />
      </span>
    </span>
  );
}
