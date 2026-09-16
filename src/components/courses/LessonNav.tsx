import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LessonContext } from "@/lib/courses/api";
import { lessonPath } from "@/lib/courses/api";

export function LessonNav({
  courseSlug,
  previous,
  next,
}: {
  courseSlug: string;
  previous?: LessonContext;
  next?: LessonContext;
}) {
  return (
    <nav
      aria-label="Navegación entre lecciones"
      className="mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={lessonPath(courseSlug, previous.lesson.slug)}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
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

      {next && (
        <Link
          href={lessonPath(courseSlug, next.lesson.slug)}
          className="group flex items-center gap-3 rounded-xl bg-brand-500 px-4 py-3.5 text-white transition-colors hover:bg-brand-600 sm:justify-end sm:text-right"
        >
          <span className="min-w-0">
            <span className="block text-xs text-white/70">Siguiente lección</span>
            <span className="block truncate text-sm font-medium">{next.lesson.title}</span>
          </span>
          <ChevronRight
            aria-hidden
            className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </nav>
  );
}
