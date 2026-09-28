/**
 * Constantes del sistema de energía.
 *
 * Se pueden importar desde cliente y servidor: aquí no hay nada secreto ni
 * ninguna decisión, solo los números con los que se habla de energía en la
 * interfaz.
 *
 * Importante: estos valores NO son la autoridad. Quien decide cuánta energía
 * hay y si se puede gastar es la base de datos (supabase/energy.sql,
 * `compute_energy_regen`). Esto sirve para pintar cuatro rayos en su sitio y
 * escribir "4" en los textos.
 */

/** Tope simultáneo de energía de una cuenta Free. Debe decir lo mismo que el CHECK de `user_energy`. */
export const FREE_MAX_ENERGY = 4;

/** Cada cuántas horas se regenera +1. Debe decir lo mismo que `compute_energy_regen()`. */
export const ENERGY_REGEN_HOURS = 3;

/** Cómo se llama esto en la interfaz, en singular y plural. */
export function energyWord(count: number): string {
  return count === 1 ? "energía" : "energías";
}
