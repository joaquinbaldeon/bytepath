/**
 * Vocabulario de la recarga de energía con tokens: el reflejo en TypeScript de
 * lo que devuelve `refill_energy_with_tokens`. (Los tokens que paga completar
 * una lección viajan en `CompleteOutcome`, ver `src/lib/courses/outcomes.ts`.)
 */

export type RefillReason =
  | "not_signed_in"
  | "premium_unlimited"
  | "energy_full"
  | "insufficient_tokens"
  | null;

export type RefillOutcome = {
  refilled: boolean;
  reason: RefillReason;
  tokens: number | null;
  remaining: number | null;
  nextEnergyAt: string | null;
};

export function noRefillOutcome(reason: RefillReason = null): RefillOutcome {
  return { refilled: false, reason, tokens: null, remaining: null, nextEnergyAt: null };
}
