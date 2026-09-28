"use client";

import { RotateCcw } from "lucide-react";
import { primaryActionClass, StatusScreen } from "@/components/layout/StatusScreen";
import "./globals.css";

/**
 * Último recurso: un error en el propio layout raíz. Sustituye al documento
 * entero, así que trae sus propias etiquetas <html>/<body> y los estilos
 * globales (no hereda los del layout). Los enlaces son <a> normales, que
 * recargan la página completa: con el layout roto, navegar dentro de la
 * aplicación podría volver a fallar.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es" data-theme="dark">
      <body className="min-h-full antialiased">
        <StatusScreen
          code="Algo ha fallado"
          title="BytePath no ha podido cargarse"
          description="Ha ocurrido un error inesperado. Vuelve a intentarlo en unos segundos."
          actions={
            <>
              <button type="button" onClick={() => retry()} className={primaryActionClass}>
                <RotateCcw aria-hidden className="size-4" />
                Reintentar
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga completa a propósito */}
              <a
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                Volver al inicio
              </a>
            </>
          }
          footnote={error.digest ? `Código de referencia: ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
