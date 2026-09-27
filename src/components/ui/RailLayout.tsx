import type { ReactNode } from "react";

/**
 * Contenido principal con raíl lateral de apoyo.
 *
 * Existe porque las superficies de producto desperdiciaban cerca del 20% del
 * ancho en pantallas grandes: el contenido se encerraba en una columna estrecha
 * y el resto quedaba vacío. Ese espacio pasa a llevar información de apoyo
 * —progreso, por dónde seguir, datos del curso— que antes competía con el
 * contenido dentro de la misma columna.
 *
 * El contenido va primero en el DOM: el raíl acompaña, no encabeza. Por debajo
 * de `lg` se apila debajo, que es donde corresponde cuando no hay sitio.
 */
export function RailLayout({ children, rail }: { children: ReactNode; rail: ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
      <div className="min-w-0">{children}</div>

      {/* Pegajoso al desplazar: es información de consulta, no de lectura
          lineal, así que tenerla siempre a la vista es lo útil. */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">{rail}</aside>
    </div>
  );
}
