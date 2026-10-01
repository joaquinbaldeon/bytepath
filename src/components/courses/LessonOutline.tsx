"use client";

import { ChevronDown, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LessonStatusIcon } from "@/components/courses/LessonStatusIcon";
import type { OutlineModule } from "@/lib/courses/api";
import { lessonPath } from "@/lib/courses/labels";

function OutlineList({
  modules,
  courseSlug,
  currentLessonSlug,
  onNavigate,
}: {
  modules: OutlineModule[];
  courseSlug: string;
  currentLessonSlug: string;
  onNavigate?: () => void;
}) {
  return (
    <ol className="space-y-5">
      {modules.map((module, moduleIndex) => (
        <li key={module.slug}>
          <p className="font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
            Módulo {moduleIndex + 1}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{module.title}</p>

          <ul className="mt-2 space-y-0.5">
            {module.lessons.map((lesson) => {
              const active = lesson.slug === currentLessonSlug;

              // Una lección bloqueada por progreso no es un destino: se ve
              // en el índice, para que se entienda el orden, pero no se pisa.
              if (lesson.status === "locked") {
                return (
                  <li key={lesson.slug}>
                    <span
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-control px-2.5 py-2 text-dense text-fg-subtle"
                    >
                      <LessonStatusIcon status="locked" className="size-4" />
                      <span className="flex-1">{lesson.title}</span>
                      <span className="sr-only">Bloqueada</span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={lesson.slug}>
                  <Link
                    href={lessonPath(courseSlug, lesson.slug)}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`focus-ring flex items-center gap-2.5 rounded-control px-2.5 py-2 text-dense transition-colors ${
                      active
                        ? "bg-learn-soft font-medium text-learn-ink"
                        : "text-fg-muted hover:bg-surface-2"
                    }`}
                  >
                    <LessonStatusIcon status={lesson.status} className="size-4" />
                    <span className="flex-1">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function LessonOutline({
  modules,
  courseSlug,
  courseTitle,
  currentLessonSlug,
}: {
  modules: OutlineModule[];
  courseSlug: string;
  courseTitle: string;
  currentLessonSlug: string;
}) {
  const [open, setOpen] = useState(false);
  // Dónde estás, a la vista aunque el índice esté plegado (móvil y tablet).
  const current = modules.flatMap((module) => module.lessons).find((lesson) => lesson.slug === currentLessonSlug);

  return (
    <>
      {/* Índice plegable mientras no hay sitio para la columna fija */}
      <div className="border-b border-line bg-surface xl:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="focus-ring-tight flex w-full items-center gap-2.5 px-5 py-3 text-sm font-medium"
        >
          <ListChecks aria-hidden className="size-4 text-learn-ink" />
          <span className="shrink-0">Contenido del curso</span>
          {current && (
            <span className="ml-auto min-w-0 truncate text-fg-muted">{current.title}</span>
          )}
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-fg-subtle transition-transform ${current ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <nav aria-label="Contenido del curso" className="px-5 pb-5">
            <OutlineList
              modules={modules}
              courseSlug={courseSlug}
              currentLessonSlug={currentLessonSlug}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        )}
      </div>

      {/* Escritorio: índice fijo */}
      <nav
        aria-label="Contenido del curso"
        className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-line bg-surface px-5 py-8 xl:block"
      >
        <p className="font-display text-sm font-semibold">{courseTitle}</p>
        <div className="mt-5">
          <OutlineList
            modules={modules}
            courseSlug={courseSlug}
            currentLessonSlug={currentLessonSlug}
          />
        </div>
      </nav>
    </>
  );
}
