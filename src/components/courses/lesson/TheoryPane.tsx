import { ChevronRight, Clock, Code, ListChecks, BookOpen } from "lucide-react";
import Link from "next/link";
import { LessonBody } from "@/components/courses/LessonBody";
import { LessonNav } from "@/components/courses/LessonNav";
import { lessonFrame } from "@/components/courses/lesson/frame";
import { lessonKindLabels, type LessonContext } from "@/lib/courses/api";
import type { Lesson, Module } from "@/lib/courses/types";

/**
 * Teoría de la lección: se renderiza en el servidor y se le pasa ya montada al
 * espacio de trabajo, así que su contenido no viaja como JavaScript al cliente.
 *
 * Dos partes con el mismo marco (`lessonFrame`): una cabecera con presencia —
 * ruta, título grande, descripción y los datos de la lección— y el cuerpo, que
 * reparte los bloques en filas (ver `LessonBody`). La cabecera aprovecha el
 * ancho poniendo los datos a la derecha del título; el texto sigue sin pasar de
 * una medida cómoda de lectura.
 */
export function TheoryPane({
  lesson,
  module,
  moduleIndex,
  position,
  total,
  courseTitle,
  courseSlug,
  coursePath,
  previous,
}: {
  lesson: Lesson;
  module: Module;
  moduleIndex: number;
  position: number;
  total: number;
  courseTitle: string;
  courseSlug: string;
  coursePath: string;
  previous?: LessonContext;
}) {
  const quizQuestions = lesson.quiz?.questions.length ?? 0;

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b border-line">
        {/* La misma textura de puntos tenue que el camino, y un halo de marca en la esquina. */}
        <div aria-hidden className="bp-page-grid absolute inset-0 -z-10 opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 -z-10 size-[28rem] rounded-full bg-brand-500/10 blur-3xl"
        />

        <div className={`${lessonFrame} py-8 @3xl:py-10 @5xl:py-12 @7xl:py-16`}>
          <nav
            aria-label="Ruta de navegación"
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-dense text-fg-muted"
          >
            <Link
              href={coursePath}
              className="focus-ring rounded-control transition-colors hover:text-fg"
            >
              {courseTitle}
            </Link>
            <ChevronRight aria-hidden className="size-3.5 text-fg-subtle" />
            <span className="font-mono text-label tracking-wider text-learn-ink uppercase">
              Módulo {moduleIndex + 1} · {module.title}
            </span>
          </nav>

          <div className="mt-5 grid gap-8 @5xl:grid-cols-[minmax(0,1fr)_17rem] @5xl:items-end @5xl:gap-12">
            <div className="min-w-0">
              <h1 className="font-display text-[2rem] leading-[1.08] font-semibold tracking-tight text-balance @3xl:text-[2.5rem] @7xl:text-5xl">
                {lesson.title}
              </h1>
              {lesson.summary && (
                <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted @5xl:text-[17px] @5xl:leading-8">
                  {lesson.summary}
                </p>
              )}
            </div>

            {/* Los datos de la lección: en fila bajo el título, y en columna a su derecha cuando hay sitio. */}
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-fg-muted @5xl:grid @5xl:gap-0 @5xl:divide-y @5xl:divide-line @5xl:rounded-card @5xl:border @5xl:border-line @5xl:bg-surface-2/60 @5xl:p-1.5">
              <div className="inline-flex items-center gap-2 @5xl:px-3 @5xl:py-2.5">
                <dt className="sr-only">Tipo</dt>
                <dd className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-learn-soft px-2.5 py-0.5 text-label font-medium text-learn-ink">
                    {lessonKindLabels[lesson.kind]}
                  </span>
                </dd>
              </div>
              <div className="inline-flex items-center gap-2 @5xl:px-3 @5xl:py-2.5">
                <dt className="sr-only">Duración</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden className="size-4 text-fg-subtle" />
                  {lesson.estimatedMinutes} min
                </dd>
              </div>
              <div className="inline-flex items-center gap-2 @5xl:px-3 @5xl:py-2.5">
                <dt className="sr-only">Posición</dt>
                <dd className="font-mono text-xs tabular-nums">
                  Lección {position} de {total}
                </dd>
              </div>
              {(quizQuestions > 0 || lesson.challenge) && (
                <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 @5xl:px-3 @5xl:py-2.5">
                  <dt className="sr-only">Incluye</dt>
                  <dd className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen aria-hidden className="size-4 text-fg-subtle" />
                      Teoría
                    </span>
                    {quizQuestions > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks aria-hidden className="size-4 text-fg-subtle" />
                        Quiz de {quizQuestions}
                      </span>
                    )}
                    {lesson.challenge && (
                      <span className="inline-flex items-center gap-1.5">
                        <Code aria-hidden className="size-4 text-fg-subtle" />
                        Desafío
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </header>

      <div className={`${lessonFrame} py-10 @3xl:py-12 @5xl:py-16`}>
        <LessonBody blocks={lesson.blocks} />
        <LessonNav courseSlug={courseSlug} coursePath={coursePath} previous={previous} />
      </div>
    </article>
  );
}
