import Link from "next/link";
import { LessonStatusIcon, lessonStatusLabels } from "@/components/courses/LessonStatusIcon";
import { lessonKindLabels, lessonPath } from "@/lib/courses/api";
import { getLessonStatus, getModuleProgress } from "@/lib/courses/progress";
import type { Course } from "@/lib/courses/types";

export function ModuleList({ course }: { course: Course }) {
  return (
    <ol className="space-y-5">
      {course.modules.map((module, moduleIndex) => {
        const progress = getModuleProgress(course, module);

        return (
          <li key={module.slug} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
                  Módulo {moduleIndex + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{module.title}</h3>
                {module.summary && <p className="mt-1 text-sm text-fg-muted">{module.summary}</p>}
              </div>
              <p className="font-mono text-xs text-fg-subtle">
                {progress.completed}/{progress.total}
              </p>
            </div>

            <ul className="divide-y divide-line-soft">
              {module.lessons.map((lesson) => {
                const status = getLessonStatus(course, lesson.slug);

                return (
                  <li key={lesson.slug}>
                    <Link
                      href={lessonPath(course.slug, lesson.slug)}
                      className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-2 sm:px-6"
                    >
                      <LessonStatusIcon status={status} />
                      <span
                        className={`flex-1 text-[15px] ${
                          status === "upcoming" ? "text-fg-muted" : "font-medium"
                        }`}
                      >
                        {lesson.title}
                      </span>
                      <span className="sr-only">{lessonStatusLabels[status]}</span>
                      {lesson.kind !== "theory" && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-muted">
                          {lessonKindLabels[lesson.kind]}
                        </span>
                      )}
                      <span className="hidden font-mono text-[11px] text-fg-subtle sm:inline">
                        {lesson.estimatedMinutes} min
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
