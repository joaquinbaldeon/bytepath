"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { primaryActionClass, StatusScreen } from "@/components/layout/StatusScreen";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/site";

/**
 * Error inesperado dentro de una página (el layout raíz sigue en pie).
 *
 * `retry()` vuelve a pedir y pintar la página: sirve para los fallos pasajeros
 * (red, un servicio que tarda). No se muestra el mensaje del error: los que
 * vienen del servidor llegan sin detalles a propósito, y solo se enseña el
 * `digest`, que permite localizar el fallo en los registros del servidor.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      code="Algo ha fallado"
      title="No hemos podido mostrar esta página"
      description="Suele ser un problema pasajero de conexión. Vuelve a intentarlo; si sigue fallando, prueba desde los cursos."
      actions={
        <>
          <button type="button" onClick={() => retry()} className={primaryActionClass}>
            <RotateCcw aria-hidden className="size-4" />
            Reintentar
          </button>
          <Button href={routes.courses} variant="outlineLight">
            Ir a los cursos
          </Button>
        </>
      }
      footnote={error.digest ? `Código de referencia: ${error.digest}` : undefined}
    />
  );
}
