import "server-only";

import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  type AccountState,
  signedOutState,
  unavailableState,
  unmeteredState,
} from "@/lib/energy/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Lectura de la energía y los derechos de la cuenta, desde el servidor.
 *
 * Solo LEE (`get_account_state`). Gastar energía es cosa exclusiva de
 * `complete_lesson`, en `src/lib/courses/actions.ts`. Todo lo demás —
 * componentes, acciones, route handlers— trabaja con `AccountState`; este
 * módulo y `toAccountState` son los únicos que conocen los nombres en
 * snake_case de la base de datos.
 *
 * Nada de lo que hay aquí calcula energía: la regeneración por reloj, el saldo
 * y el descuento ocurren dentro de la base de datos. Esto solo pregunta y
 * traduce la respuesta.
 */

/** Forma del jsonb que devuelven `get_account_state`, `_energy_view` y `complete_lesson`. */
export type RawAccount = {
  signed_in?: boolean;
  premium: boolean;
  limit: number | null;
  remaining: number | null;
  next_energy_at: string | null;
  tokens?: number | null;
};

export function toAccountState(raw: RawAccount): AccountState {
  return {
    // `complete_lesson` y `_energy_view` solo se ejecutan para un usuario con
    // sesión, y no repiten la marca: se da por buena salvo que diga lo contrario.
    signedIn: raw.signed_in ?? true,
    isPremium: raw.premium,
    metered: true,
    unavailable: false,
    remaining: raw.remaining,
    limit: raw.limit,
    nextEnergyAt: raw.next_energy_at,
    tokens: raw.tokens ?? null,
  };
}

/**
 * Estado de la cuenta.
 *
 * Va envuelto en `cache()` de React: durante un mismo render, varios
 * componentes pueden preguntarlo sin provocar varias consultas.
 *
 * No escribe nada. Leer una página nunca debe modificar la energía; la
 * regeneración se calcula igual aquí que al completar (la misma función pura
 * `compute_energy_regen`), así que la cifra que se pinta y la que se descuenta
 * no pueden discrepar.
 */
export const readAccountState = cache(async (): Promise<AccountState> => {
  if (!isSupabaseConfigured()) return unmeteredState();

  // Sin sesión no se llama a la función: su EXECUTE no está concedido a `anon`.
  const user = await getCurrentUser();
  if (!user) return signedOutState();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_account_state");

  if (error || !data) {
    // NO se falla hacia "energía ilimitada": el estudiante ve que el sistema
    // no responde, y el log dice por qué (`schema_missing`, `permission`...).
    logSupabaseFailure("energy", "get_account_state", describeSupabaseError(error));
    return unavailableState();
  }

  return toAccountState(data as RawAccount);
});
