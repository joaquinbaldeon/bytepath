/**
 * Constantes del sistema de tokens.
 *
 * Igual que `energy/config.ts`: sirven para pintar la interfaz, no son la
 * autoridad. La cantidad real la decide `supabase/economy.sql` — literal en
 * `complete_lesson()` y `refill_energy_with_tokens()` — y nunca un valor que
 * llegue del cliente.
 */

/** Recompensa por completar una lección por primera vez. Debe decir lo mismo que `complete_lesson()`. */
export const LESSON_COMPLETION_REWARD = 15;

/** Coste de una recarga completa de energía. Debe decir lo mismo que `refill_energy_with_tokens()`. */
export const ENERGY_REFILL_COST = 50;
