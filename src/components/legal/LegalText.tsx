import type { ReactNode } from "react";
import { LEGAL_OWNER, LEGAL_PLACEHOLDERS, type LegalOwnerField } from "@/lib/legal/documents";

/**
 * Piezas de texto de los documentos legales.
 *
 * Son deliberadamente pocas y sobrias: párrafo, lista y los datos del
 * responsable. Lo que importa en un documento así es que se lea bien —medida
 * de línea cómoda, interlineado generoso, jerarquía clara—, no el adorno.
 */

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.975rem] leading-7 text-fg-body">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-col gap-2 pl-5 text-[0.975rem] leading-7 text-fg-body marker:text-fg-subtle [list-style:disc]">
      {children}
    </ul>
  );
}

/** Término destacado dentro de un párrafo: la primera vez que se define algo. */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-fg">{children}</strong>;
}

/**
 * Dato pendiente de confirmar. Se ve a propósito —fondo ámbar y borde
 * discontinuo—: un marcador que pase desapercibido acabaría publicado.
 */
export function Pending({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-[4px] border border-dashed border-energy-ink/50 bg-energy-soft px-1 py-px font-mono text-[0.8em] font-medium break-words text-energy-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
      {children}
    </mark>
  );
}

/** Un dato del responsable: su valor confirmado o, si falta, su marcador visible. */
export function Owner({ field }: { field: LegalOwnerField }) {
  const value = LEGAL_OWNER[field];
  if (value === null) return <Pending>{LEGAL_PLACEHOLDERS[field]}</Pending>;

  if (field === "email") {
    return (
      <a href={`mailto:${value}`} className="focus-ring rounded-control font-medium text-brand-ink hover:underline">
        {value}
      </a>
    );
  }
  return <>{value}</>;
}
