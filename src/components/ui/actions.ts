/**
 * Clases de acción de BytePath.
 *
 * Los botones y enlaces-botón se estaban escribiendo a mano en cada archivo,
 * con cuatro alturas (h-9/h-10/h-11/h-12) y dos radios para lo mismo. Estas
 * tres jerarquías cubren todo el producto:
 *
 *   · primary    →  LA acción de la pantalla. Una por vista.
 *   · secondary  →  alternativa válida (volver al camino, repasar).
 *   · quiet      →  salida discreta, sin borde.
 *
 * `active:scale` da la respuesta táctil al pulsar; se anula con
 * prefers-reduced-motion desde globals.css (`.bp-press`).
 */

const base =
  "focus-ring bp-press group inline-flex items-center justify-center gap-2 rounded-control font-medium transition-[background-color,border-color,color,transform] disabled:cursor-not-allowed";

export const actionSize = {
  sm: "h-9 px-3 text-dense",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

export const action = {
  primary: `${base} bg-brand-500 text-white shadow-[0_10px_30px_-12px_rgb(109_94_246/0.7)] hover:bg-brand-600 disabled:bg-brand-500/50 disabled:shadow-none`,
  secondary: `${base} border border-line bg-surface text-fg hover:bg-surface-2 disabled:opacity-60`,
  quiet: `${base} text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-60`,
  energy: `${base} bg-energy text-ink hover:brightness-95 disabled:bg-surface-2 disabled:text-fg-subtle`,
} as const;

/** Atajo: jerarquía + tamaño. */
export function actionClass(kind: keyof typeof action, size: keyof typeof actionSize = "md"): string {
  return `${action[kind]} ${actionSize[size]}`;
}
