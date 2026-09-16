import { Clock } from "lucide-react";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { LessonNav } from "@/components/courses/LessonNav";
import { lessonKindLabels, type LessonContext } from "@/lib/courses/api";
import type { Lesson, Module } from "@/lib/courses/types";

/**
 * Panel izquierdo: se renderiza en el servidor y se le pasa ya montado al
 * espacio de trabajo, así que su contenido no viaja como JavaScript al cliente.
 */
export function TheoryPane({
  lesson,
  module,
  moduleIndex,
  position,
  total,
  courseSlug,
  previous,
  next,
}: {
  lesson: Lesson;
  module: Module;
  moduleIndex: number;
  position: number;
  total: number;
  courseSlug: string;
  previous?: LessonContext;
  next?: LessonContext;
}) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
      <header>
        <p className="font-mono text-[11px] tracking-wider text-learn-ink uppercase">
          Módulo {moduleIndex + 1} · {module.title}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {lesson.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-fg-muted">
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px]">
            {lessonKindLabels[lesson.kind]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="size-4 text-fg-subtle" />
            {lesson.estimatedMinutes} min
          </span>
          <span className="font-mono text-xs">
            Lección {position} de {total}
          </span>
        </div>
        {lesson.summary && <p className="mt-5 text-[17px] leading-8 text-fg-muted">{lesson.summary}</p>}
      </header>

      <div className="mt-9">
        <LessonBlocks blocks={lesson.blocks} />
      </div>

      {/* Moverse por el curso sin tener que completar el quiz antes. */}
      <LessonNav courseSlug={courseSlug} previous={previous} next={next} />
    </article>
  );
}
