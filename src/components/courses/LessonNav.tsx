import { ChevronLeft, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import type { LessonContext } from "@/lib/courses/api";
import { lessonPath } from "@/lib/courses/api";

/**
 * Salidas al final de la teoría: la lección anterior y el camino.
 *
 * Ya no hay "Siguiente lección" aquí. Con el camino, la siguiente lección se
 * desbloquea al completar esta, y entrar a ella es una acción con
 * consecuencias (cuesta energía): no puede ser un enlace suelto al final de un
 * texto. La forma de avanzar es terminar la lección con el botón "Continuar".
 */
export function LessonNav({
  courseSlug,
  coursePath,
  previous,
}: {
  courseSlug: string;
  coursePath: string;
  previous?: LessonContext;
}) {
  return (
    <nav
      aria-label="Navegación entre lecciones"
      className="mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={lessonPath(courseSlug, previous.lesson.slug)}
          className="focus-ring group flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
        >
          <ChevronLeft
            aria-hidden
            className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:-translate-x-0.5"
          />
          <span className="min-w-0">
            <span className="block text-xs text-fg-muted">Lección anterior</span>
            <span className="block truncate text-sm font-medium">{previous.lesson.title}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}

      <Link
        href={coursePath}
        className="focus-ring group flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2 sm:justify-end sm:text-right"
      >
        <span className="min-w-0">
          <span className="block text-xs text-fg-muted">Salir al</span>
          <span className="block truncate text-sm font-medium">Camino del curso</span>
        </span>
        <MapIcon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
      </Link>
    </nav>
  );
}
