import type { ReactNode } from "react";

/**
 * Ancho de página.
 *
 * `default` es el ancho histórico (max-w-6xl) y se mantiene tal cual: es el
 * que usa la Home, y cambiarlo la movería.
 *
 * `wide` es la espina de las superficies de producto —catálogo y curso—, donde
 * hace falta sitio para el contenido y el raíl lateral. Antes esas páginas
 * dejaban sin usar cerca del 20% del ancho en una pantalla de 1440px.
 */
const widths = {
  default: "max-w-6xl",
  wide: "max-w-page",
  reading: "max-w-reading",
} as const;

export function Container({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full ${widths[width]} px-5 sm:px-8 ${className}`}>{children}</div>
  );
}
