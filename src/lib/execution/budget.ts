/**
 * Tope global de ejecuciones de código al día: la parte pura (sin red, sin
 * base de datos), para poder probarla directamente.
 *
 * Por qué existe: con Judge0 en pago por uso cada ejecución cuesta dinero, y
 * el límite por usuario (12/min, 300/día, `consume_run_quota`) no acota el
 * total del sitio. Este tope es el freno de emergencia: al llegar, se dejan de
 * ejecutar desafíos hasta que se renueva la ventana, en vez de seguir gastando.
 *
 * Se cuenta en EJECUCIONES, no en envíos de Judge0. Una ejecución de un
 * desafío manda un envío por caso de prueba (hoy unos 4 de media), así que
 * para fijar el valor: límite de ejecuciones ≈ envíos que quieres pagar al día
 * ÷ casos por desafío.
 */

/** Porcentajes del tope en los que se deja constancia en los registros. */
export const BUDGET_ALERT_PERCENTS = [50, 80, 100] as const;
export type BudgetAlertPercent = (typeof BUDGET_ALERT_PERCENTS)[number];

/**
 * Lee `JUDGE0_DAILY_RUN_LIMIT`. Devuelve `null` (sin tope) si no está definido
 * o no es un entero positivo: un valor roto no debe cortar la ejecución en
 * silencio ni dejar un tope sin querer.
 */
export function parseDailyRunLimit(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/**
 * Si con esta ejecución (la número `used` de la ventana) se acaba de cruzar un
 * umbral de aviso, devuelve el porcentaje; si no, `null`. Cada umbral salta
 * una sola vez por ventana porque `used` solo crece de uno en uno. Con topes
 * muy pequeños varios umbrales caen en la misma ejecución: se devuelve el más
 * alto.
 */
export function alertCrossed(used: number, limit: number): BudgetAlertPercent | null {
  for (const percent of [...BUDGET_ALERT_PERCENTS].reverse()) {
    if (used === Math.ceil((limit * percent) / 100)) return percent;
  }
  return null;
}

/** "3 h", "45 min" o "1 min", para decir cuándo se renueva el tope. */
export function describeWait(seconds: number): string {
  const wait = Math.max(1, Math.ceil(seconds));
  if (wait < 90 * 60) return `${Math.max(1, Math.ceil(wait / 60))} min`;
  return `${Math.ceil(wait / 3600)} h`;
}
