"use client";

import { useCallback, useState } from "react";
import { patchAccountState } from "@/lib/energy/store";
import { refillEnergyAction } from "@/lib/tokens/actions";

/**
 * Recargar la energía con tokens desde cualquier pantalla.
 *
 * Solo manda la petición y publica el resultado en el almacén global de la
 * cuenta; quien lo use lee la energía y los tokens de ahí (`useLiveAccount`),
 * así que el medidor de la cabecera, el panel del camino y la lección se
 * enteran a la vez sin coordinarse entre sí.
 */
export function useEnergyRefill() {
  const [refilling, setRefilling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refill = useCallback(async () => {
    setRefilling(true);
    setNotice(null);
    try {
      const outcome = await refillEnergyAction();

      if (outcome.refilled) {
        patchAccountState({
          remaining: outcome.remaining,
          tokens: outcome.tokens,
          nextEnergyAt: outcome.nextEnergyAt,
        });
        setNotice("Energía recargada al máximo.");
      } else {
        // Rechazada, pero puede traer un saldo más al día (otra pestaña gastó
        // tokens mientras tanto): se refleja igualmente.
        if (outcome.tokens !== null) patchAccountState({ tokens: outcome.tokens });
        setNotice(
          outcome.reason === "energy_full"
            ? "Ya tienes la energía al máximo."
            : "No tienes tokens suficientes todavía.",
        );
      }
    } catch {
      setNotice("No se ha podido recargar. Inténtalo de nuevo.");
    } finally {
      setRefilling(false);
    }
  }, []);

  return { refill, refilling, notice };
}
