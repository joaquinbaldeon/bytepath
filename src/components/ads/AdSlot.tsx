"use client";

import { useAccountState } from "@/lib/energy/store";

/**
 * Hueco de anuncio del raíl lateral.
 *
 * Todavía no hay ningún proveedor de publicidad: esto es el sitio reservado y
 * la regla de quién lo ve, que es lo que había que dejar resuelto. Mientras no
 * haya anuncios ni Premium de pago, el hueco lo dice tal cual, sin aparentar un
 * sistema comercial que no existe. Mantiene el rótulo «Patrocinado»: los
 * Términos y la Política de Privacidad describen este espacio con ese nombre.
 *
 * La regla, literalmente: si el usuario es Premium, este componente devuelve
 * `null`. No se pinta y se oculta; no llega a existir en el árbol. La
 * diferencia importa —cuando aquí haya un script de terceros, un `display:
 * none` habría cargado igualmente el anuncio, habría hecho la petición y
 * habría contado la impresión— así que la condición se resuelve antes de
 * renderizar y no en CSS.
 *
 * Cuando llegue el proveedor real, la petición del anuncio debe salir también
 * de un camino que compruebe los derechos en el servidor
 * (`getEntitlements()`): esta comprobación es la de la interfaz, no la única.
 *
 * Es una tarjeta más del raíl, la última. El raíl no existe para esto: existe
 * para el progreso y el contexto del curso, y por eso sigue teniendo sentido
 * entero si algún día este hueco desaparece.
 */
export function AdSlot() {
  const state = useAccountState();

  // Mientras no se sabe, no se pinta: así nadie con Premium llega a ver el
  // hueco ni por un fotograma.
  if (!state) return null;
  if (state.isPremium) return null;

  return (
    <aside
      aria-label="Espacio patrocinado"
      className="rounded-card border border-dashed border-line bg-surface-2/60 p-4"
    >
      <p className="font-mono text-label tracking-wider text-fg-subtle uppercase">Patrocinado</p>

      <p className="mt-2.5 text-dense leading-6 text-fg-muted">
        Hoy BytePath no muestra anuncios. Este espacio está reservado por si algún día los hay, y
        lo avisaríamos antes.
      </p>
    </aside>
  );
}
