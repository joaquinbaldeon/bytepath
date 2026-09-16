import { BookOpen, Clock, Route } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  coursePath,
  difficultyLabels,
  formatDuration,
  getCourseStats,
  lessonPath,
} from "@/lib/courses/api";
import { getCourseProgress, getResumeLesson } from "@/lib/courses/progress";
import type { Course, Difficulty } from "@/lib/courses/types";

const difficultyTone: Record<Difficulty, "easy" | "medium" | "hard"> = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

export function CourseCard({ course }: { course: Course }) {
  const stats = getCourseStats(course);
  const progress = getCourseProgress(course);
  const resume = getResumeLesson(course);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-learn/50 hover:shadow-card">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-fg-muted">
          {course.language}
        </span>
        <Badge tone={difficultyTone[course.difficulty]}>
          {difficultyLabels[course.difficulty]}
        </Badge>
      </div>

      <h3 className="mt-4 font-display text-xl font-semibold">
        {/* El enlace cubre toda la tarjeta; el botón queda por encima. */}
        <Link href={coursePath(course.slug)} className="after:absolute after:inset-0">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 leading-relaxed text-fg-muted">{course.summary}</p>

      <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-muted">
        <div className="inline-flex items-center gap-1.5">
          <Route aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Módulos</dt>
          <dd>{stats.moduleCount} módulos</dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <BookOpen aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Lecciones</dt>
          <dd>{stats.lessonCount} lecciones</dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Clock aria-hidden className="size-4 text-fg-subtle" />
          <dt className="sr-only">Duración estimada</dt>
          <dd>{formatDuration(stats.estimatedMinutes)}</dd>
        </div>
      </dl>

      {progress.started && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-muted">
              {progress.completed} de {progress.total} lecciones
            </span>
            <span className="font-mono font-medium text-learn-ink">{progress.percent}%</span>
          </div>
          <ProgressBar
            value={progress.percent}
            className="mt-2"
            label={`Progreso de ${course.title}`}
          />
        </div>
      )}

      {resume && (
        <Button
          href={lessonPath(course.slug, resume.slug)}
          variant="outlineLight"
          arrow
          className="relative mt-6 self-start"
        >
          {progress.started ? "Continuar" : "Empezar"}
        </Button>
      )}
    </article>
  );
}
