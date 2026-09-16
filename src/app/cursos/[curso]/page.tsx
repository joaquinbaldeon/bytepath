import { BookOpen, ChevronRight, Clock, Route, Terminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleList } from "@/components/courses/ModuleList";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  coursesPath,
  difficultyLabels,
  formatDuration,
  getCourse,
  getCourses,
  getCourseStats,
  lessonPath,
} from "@/lib/courses/api";
import { getCourseProgress, getResumeLesson } from "@/lib/courses/progress";
import type { Difficulty } from "@/lib/courses/types";

const difficultyTone: Record<Difficulty, "easy" | "medium" | "hard"> = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

export function generateStaticParams() {
  return getCourses().map((course) => ({ curso: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/cursos/[curso]">): Promise<Metadata> {
  const { curso } = await params;
  const course = getCourse(curso);
  if (!course) return {};

  return {
    title: `${course.title} · BytePath`,
    description: course.summary,
  };
}

export default async function CoursePage({ params }: PageProps<"/cursos/[curso]">) {
  const { curso } = await params;
  const course = getCourse(curso);
  if (!course) notFound();

  const stats = getCourseStats(course);
  const progress = getCourseProgress(course);
  const resume = getResumeLesson(course);

  const facts = [
    { icon: Terminal, label: course.language },
    { icon: Route, label: `${stats.moduleCount} módulos` },
    { icon: BookOpen, label: `${stats.lessonCount} lecciones` },
    { icon: Clock, label: formatDuration(stats.estimatedMinutes) },
  ];

  return (
    <>
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-night-900 pt-28 pb-14 text-white sm:pt-36 sm:pb-16">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <Container>
            <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-sm">
              <Link href={coursesPath} className="text-slate-400 transition-colors hover:text-white">
                Cursos
              </Link>
              <ChevronRight aria-hidden className="size-3.5 text-slate-600" />
              <span className="text-slate-300">{course.title}</span>
            </nav>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone={difficultyTone[course.difficulty]}>
                {difficultyLabels[course.difficulty]}
              </Badge>
              {course.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              {course.description}
            </p>

            <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              {facts.map((fact) => (
                <div key={fact.label} className="inline-flex items-center gap-2">
                  <fact.icon aria-hidden className="size-4 text-slate-500" />
                  <dt className="sr-only">Detalle del curso</dt>
                  <dd>{fact.label}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 max-w-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {progress.completed} de {progress.total} lecciones completadas
                </span>
                <span className="font-mono font-medium text-learn">{progress.percent}%</span>
              </div>
              <ProgressBar
                value={progress.percent}
                onDark
                className="mt-2"
                label={`Progreso de ${course.title}`}
              />
            </div>

            {resume && (
              <Button
                href={lessonPath(course.slug, resume.slug)}
                size="lg"
                arrow
                className="mt-8"
              >
                {progress.finished
                  ? "Repasar el curso"
                  : progress.started
                    ? "Continuar"
                    : "Empezar curso"}
              </Button>
            )}
          </Container>
        </section>

        <section className="bg-canvas py-14 sm:py-16">
          <Container className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Contenido del curso
            </h2>
            <p className="mt-2 text-fg-muted">
              {stats.moduleCount} módulos · {stats.lessonCount} lecciones
            </p>
            <div className="mt-8">
              <ModuleList course={course} />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
