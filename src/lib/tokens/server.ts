import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { type RefillOutcome, noRefillOutcome } from "@/lib/tokens/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Recarga de energía con tokens, desde el servidor: la única capa que habla con
 * `refill_energy_with_tokens` y la única que conoce sus nombres en snake_case.
 *
 * Nada de esto decide cuánto cuesta algo: ese número vive en `economy.sql`,
 * escrito como literal dentro de la función. Esto solo pregunta y traduce.
 */

type RawRefill = {
  refilled: boolean;
  reason: string | null;
  tokens: number | null;
  remaining: number | null;
  next_energy_at: string | null;
};

function toRefillReason(value: string | null): RefillOutcome["reason"] {
  if (
    value === "not_signed_in" ||
    value === "premium_unlimited" ||
    value === "energy_full" ||
    value === "insufficient_tokens"
  ) {
    return value;
  }
  return null;
}

/** Cambia 50 tokens por energía llena. Ver `refill_energy_with_tokens()` para las reglas. */
export async function refillEnergyWithTokens(): Promise<RefillOutcome> {
  if (!isSupabaseConfigured()) return noRefillOutcome();

  const user = await getCurrentUser();
  if (!user) return noRefillOutcome("not_signed_in");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("refill_energy_with_tokens");

  if (error || !data) {
    logSupabaseFailure("tokens", "refill_energy_with_tokens", describeSupabaseError(error));
    return noRefillOutcome();
  }

  const raw = data as RawRefill;
  return {
    refilled: raw.refilled,
    reason: toRefillReason(raw.reason),
    tokens: raw.tokens,
    remaining: raw.remaining,
    nextEnergyAt: raw.next_energy_at,
  };
}
