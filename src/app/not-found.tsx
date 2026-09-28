import type { Metadata } from "next";
import { StatusScreen } from "@/components/layout/StatusScreen";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Página no encontrada · BytePath",
};

/**
 * 404 de toda la aplicación: rutas que no existen y los `notFound()` de cursos
 * y lecciones. Siempre ofrece volver a una zona válida.
 */
export default function NotFound() {
  return (
    <StatusScreen
      code="Error 404"
      title="Esta página no existe"
      description="Puede que el enlace esté mal escrito o que la página se haya movido. Tu progreso no se ha perdido."
      actions={
        <>
          <Button href={routes.courses} arrow>
            Ir a los cursos
          </Button>
          <Button href={routes.home} variant="outlineLight">
            Volver al inicio
          </Button>
        </>
      }
    />
  );
}
