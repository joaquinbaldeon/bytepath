"use client";

import { Zap } from "lucide-react";
import { useState } from "react";

/**
 * Fila de rayos: uno por energía, llenos los que quedan.
 *
 * Es la representación única de la energía en BytePath —la barra superior, el
 * panel del camino y la confirmación al completar una lección la usan—, y es
 * quien anima el cambio: al bajar de 6 a 5, el sexto rayo se apaga con un
 * destello, y al subir se enciende. Lo hace el propio rayo que cambia, no el
 * medidor entero, para que se lea como "se ha ido ESTE".
 *
 * El aviso de qué rayo cambió se calcula durante el render comparando con la
 * cifra anterior (el patrón que React documenta para "ajustar estado cuando
 * cambia una prop"), no en un efecto: un `setState` síncrono dentro de un
 * efecto provoca un segundo render en cascada.
 *
 * `size` en clases de Tailwind para el icono; `tone` elige la paleta según
 * el fondo (oscuro en la barra superior, del tema en el resto).
 */
export function EnergyBolts({
  remaining,
  limit,
  from,
  iconClassName = "size-4",
  tone = "theme",
  className = "",
}: {
  remaining: number;
  limit: number;
  /**
   * Cifra de la que se viene. Sin ella, el medidor arranca ya en `remaining` y
   * no anima nada al montarse; con ella (la confirmación de "-1 ⚡", que
   * aparece justo DESPUÉS del cambio) se ve la transición `from` → `remaining`.
   */
  from?: number;
  iconClassName?: string;
  tone?: "theme" | "dark";
  className?: string;
}) {
  const [previous, setPrevious] = useState(from ?? remaining);
  const [change, setChange] = useState<{ index: number; kind: "drop" | "gain" } | null>(null);

  if (remaining !== previous) {
    setPrevious(remaining);
    // Un salto grande (recarga de 0 a 6) no anima cada rayo: solo el último que cambió.
    setChange(
      remaining < previous
        ? { index: remaining, kind: "drop" }
        : { index: remaining - 1, kind: "gain" },
    );
  }

  const off = tone === "dark" ? "fill-white/10 text-white/25" : "fill-line text-fg-subtle/60";

  return (
    <span aria-hidden className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: limit }, (_, index) => {
        const changed = change?.index === index;
        return (
          <Zap
            // La clave cambia con el movimiento para que la animación se
            // reinicie si el mismo rayo cambia dos veces seguidas.
            key={changed ? `${index}-${change.kind}-${remaining}` : index}
            className={`${iconClassName} ${index < remaining ? "fill-energy text-energy" : off} ${
              changed ? (change.kind === "drop" ? "bp-bolt-drop" : "bp-bolt-gain") : ""
            }`}
          />
        );
      })}
    </span>
  );
}
