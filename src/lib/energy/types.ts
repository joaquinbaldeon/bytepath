/**
 * Vocabulario del sistema de energía.
 *
 * Estas formas son el reflejo en TypeScript de lo que devuelven
 * `get_account_state`, `complete_lesson` y `refill_energy_with_tokens`. El
 * mapeo está en `src/lib/energy/server.ts` y es el único sitio que conoce los
 * nombres en snake_case de la base de datos.
 *
 * Modelo: la energía solo se gasta al COMPLETAR una lección. Abrir, leer o
 * repasar una lección no la toca.
 */

export type AccountState = {
  signedIn: boolean;
  isPremium: boolean;
  /**
   * Si la energía se está midiendo de verdad. Es falso en dos situaciones muy
   * distintas, que `unavailable` separa:
   *   · el proyecto no tiene Supabase configurado → no hay cuentas ni límites
   *     (`unavailable` = false);
   *   · hay cuenta, pero el servidor no ha podido leer la energía
   *     (`unavailable` = true): el esquema sin aplicar, una clave que falta...
   */
  metered: boolean;
  /**
   * El sistema de cuentas está configurado pero no ha respondido. NO se
   * disfraza de "energía ilimitada": la interfaz lo dice, y completar
   * lecciones queda en pausa hasta que se arregle. Fallar en silencio hacia el
   * lado permisivo es justo lo que hizo que el sistema pareciera no funcionar.
   */
  unavailable: boolean;
  /** Energía disponible ahora mismo. `null` cuando es ilimitada (Premium) o no hay dato. */
  remaining: number | null;
  /** Tope simultáneo. `null` cuando es ilimitado (Premium) o no hay dato. */
  limit: number | null;
  /**
   * Instante (ISO 8601) en el que se sumará la próxima energía, o `null`
   * cuando ya está al tope o no aplica.
   *
   * Es un instante absoluto, no una cuenta atrás: el cliente solo lo formatea
   * ("Próxima energía en 2h 14m"), nunca lo usa para calcular cuánta energía
   * hay — eso siempre sale de `remaining`, tal como lo dio el servidor.
   */
  nextEnergyAt: string | null;
  /** Saldo de tokens. `null` cuando no aplica. */
  tokens: number | null;
};

/** Sin Supabase no hay cuentas, ni energía, ni progreso que bloquee: el proyecto funciona igual. */
export function unmeteredState(): AccountState {
  return {
    signedIn: false,
    isPremium: false,
    metered: false,
    unavailable: false,
    remaining: null,
    limit: null,
    nextEnergyAt: null,
    tokens: null,
  };
}

/** Visitante sin sesión: hay cuentas, y todavía no ha entrado a ninguna. */
export function signedOutState(): AccountState {
  return { ...unmeteredState(), metered: true };
}

/** Hay sesión, pero la energía no se ha podido leer. Ver `AccountState.unavailable`. */
export function unavailableState(): AccountState {
  return { ...unmeteredState(), signedIn: true, unavailable: true };
}
