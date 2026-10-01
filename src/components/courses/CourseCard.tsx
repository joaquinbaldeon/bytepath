import { ArrowRight, BookOpen, Clock, Route } from "lucide-react";
import Link from "next/link";
import { actionClass } from "@/components/ui/actions";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  coursePath,
  difficultyLabels,
  formatDuration,
  getCourseStats,
  lessonPath,
} from "@/lib/courses/api";
import {
  type CourseProgressMap,
  getCourseProgress,
  getResumeLesson,
} from "@/lib/courses/progress";
import type { Course, Difficulty } from "@/lib/courses/types";

const difficultyTone: Record<Difficulty, "easy" | "medium" | "hard"> = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

export function CourseCard({
  course,
  progress: courseProgress,
}: {
  course: Course;
  /** Progreso persistido del estudiante en este curso (vacío si no lo hay). */
  progress: CourseProgressMap;
}) {
  const stats = getCourseStats(course);
  const progress = getCourseProgress(course, courseProgress);
  const resume = getResumeLesson(course, courseProgress);

  return (
    // El foco vive en la tarjeta, no en el texto del enlace: como el enlace
    // cubre toda la tarjeta con un pseudoelemento, subrayar solo el título
    // dejaría el anillo en un sitio que no corresponde con el área pulsable.
    <article className="group relative flex flex-col rounded-panel border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-learn/50 hover:shadow-card has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-400">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-label text-fg-muted">
          {course.language}
        </span>
        <Badge tone={difficultyTone[course.difficulty]}>{difficultyLabels[course.difficulty]}</Badge>
        {stats.inPreparation && <Badge tone="soon">En preparación</Badge>}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold">
        <Link href={coursePath(course.slug)} className="rounded-control after:absolute after:inset-0">
          {course.title}
        </Link>
      </h3>
      <p className="mt-1.5 flex-1 text-body leading-relaxed text-fg-muted">{course.summary}</p>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-dense text-fg-muted">
        <div className="inline-flex items-center gap-1.5">
          <Route aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Módulos</dt>
          <dd>{stats.moduleCount} módulos</dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <BookOpen aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Lecciones</dt>
          <dd>
            {stats.inPreparation
              ? `${stats.readyLessonCount} de ${stats.lessonCount} lecciones disponibles`
              : `${stats.lessonCount} lecciones`}
          </dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Clock aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Duración estimada</dt>
          <dd>{formatDuration(stats.inPreparation ? stats.readyMinutes : stats.estimatedMinutes)}</dd>
        </div>
      </dl>

      {progress.started && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-label">
            <span className="text-fg-muted">
              {progress.completed} de {progress.total} lecciones
            </span>
            <span className="font-mono font-medium text-learn-ink tabular-nums">
              {progress.percent}%
            </span>
          </div>
          <ProgressBar
            value={progress.percent}
            className="mt-1.5"
            label={`Progreso de ${course.title}`}
          />
        </div>
      )}

      {resume && (
        <div className="relative mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            href={lessonPath(course.slug, resume.slug)}
            className={actionClass(progress.started && !progress.finished ? "primary" : "secondary", "sm")}
          >
            {progress.finished ? "Repasar" : progress.started ? "Continuar" : "Empezar"}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          {progress.started && !progress.finished && (
            <span className="min-w-0 truncate text-dense text-fg-muted">
              Siguiente: <span className="font-medium text-fg">{resume.title}</span>
            </span>
          )}
          {progress.finished && (
            <span className="text-dense font-medium text-practice-ink">¡Curso terminado! 🏆</span>
          )}
        </div>
      )}
    </article>
  );
}
