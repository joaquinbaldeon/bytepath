import { Loader2 } from "lucide-react";

/**
 * Botón de envío de los formularios de cuenta.
 *
 * El `Button` de la interfaz general es un enlace, así que no sirve para
 * enviar un formulario. Esto reproduce su aspecto con un `<button>` real,
 * como ya hacen el quiz y el editor de desafíos.
 *
 * Mientras está enviando queda deshabilitado: es lo que evita que varios
 * clics seguidos disparen varios registros. El rótulo de espera lo pone cada
 * formulario, porque "Iniciando sesión…" y "Creando cuenta…" dicen mucho más
 * que un texto genérico.
 */
export function SubmitButton({
  pending,
  pendingLabel,
  disabled = false,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  /** Deshabilitado por una condición del formulario (p. ej., sin aceptar los Términos). */
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className="focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-500 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-500/60"
    >
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
