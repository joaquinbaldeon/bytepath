import type { ComponentProps } from "react";

/**
 * Campo de formulario de las páginas de cuenta.
 *
 * Usa tokens semánticos, así que se lee igual en tema claro y oscuro.
 */
export function AuthField({
  label,
  hint,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-dense font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className="focus-ring mt-1.5 h-11 w-full rounded-control border border-line bg-canvas px-3.5 text-body text-fg transition-colors placeholder:text-fg-subtle focus:border-brand-400 disabled:opacity-60"
        {...props}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-label leading-5 text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}
