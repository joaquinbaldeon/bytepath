import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  DatabaseZap,
  Route,
  Terminal,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/ads/AdSlot";
import { LearningPath } from "@/components/courses/path/LearningPath";
import { EnergyPanel } from "@/components/energy/EnergyPanel";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RailSection, RailStat } from "@/components/ui/RailCard";
import { RailLayout } from "@/components/ui/RailLayout";
import {
  coursesPath,
  difficultyLabels,
  formatDuration,
  getCourse,
  getCourseStats,
  lessonPath,
} from "@/lib/courses/api";
import { buildPath } from "@/lib/courses/path";
import { getCourseProgress, getResumeLesson } from "@/lib/courses/progress";
import { readCourseProgress } from "@/lib/courses/server";
import type { Difficulty } from "@/lib/courses/types";
import { readAccountState } from "@/lib/energy/server";
import { routes } from "@/lib/site";
import { adviceFor } from "@/lib/supabase/errors";

const difficultyTone: Record<Difficulty, "easy" | "medium" | "hard"> = {
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

export async function generateMetadata({
  params,
}: PageProps<"/cursos/[curso]">): Promise<Metadata> {
  const { curso } = await params;
  const course = getCourse(curso);
  if (!course) return { title: "Página no encontrada · BytePath" };

  return {
    title: `${course.title} · BytePath`,
    description: course.summary,
  };
}

/**
 * Página de un curso: cabecera, camino de aprendizaje y, al lado, lo que
 * acompaña al camino (progreso, energía, datos del curso).
 *
 * Es dinámica: el estado de cada nodo —qué está completado, qué toca ahora,
 * qué está bloqueado— sale del progreso PERSISTIDO de quien mira, y no se
 * puede prerenderizar sin conocer al usuario. Son dos páginas de curso, así
 * que el coste es despreciable frente a que el camino salga bien pintado a la
 * primera, sin parpadeo de "todo bloqueado" mientras llega el progreso.
 */
export default async function CoursePage({ params }: PageProps<"/cursos/[curso]">) {
  const { curso } = await params;
  const course = getCourse(curso);
  if (!course) notFound();

  const stats = getCourseStats(course);
  const { enforce, signedIn, unavailable, failureKind, progress } = await readCourseProgress(course.slug);
  const account = await readAccountState();

  const summary = getCourseProgress(course, progress);
  const resume = getResumeLesson(course, progress);
  const modules = buildPath(course, progress, enforce);
  const needsLogin = enforce && !signedIn;

  return (
    <>
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-night-900 pt-24 pb-10 text-white sm:pt-28 sm:pb-12">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <Container width="wide">
            <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-dense">
              <Link
                href={coursesPath}
                className="rounded-control text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                Cursos
              </Link>
              <ChevronRight aria-hidden className="size-3.5 text-slate-600" />
              <span className="text-slate-300">{course.title}</span>
            </nav>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge tone={difficultyTone[course.difficulty]}>
                {difficultyLabels[course.difficulty]}
              </Badge>
              {stats.inPreparation && <Badge tone="soonDark">En preparación</Badge>}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-label text-slate-300">
                <Terminal aria-hidden className="size-3" />
                {course.language}
              </span>
              {course.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-2.5 py-0.5 text-label text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">{course.description}</p>
            {stats.inPreparation && (
              <p className="mt-3 max-w-2xl text-dense leading-6 text-slate-400">
                Curso en preparación: hoy tiene {stats.readyLessonCount} de {stats.lessonCount}{" "}
                lecciones con contenido. Las demás aparecen en el camino como «En preparación».
              </p>
            )}

            {resume && (
              <div className="mt-6">
                <Link href={lessonPath(course.slug, resume.slug)} className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 text-[15px] font-medium text-white shadow-[0_10px_30px_-10px_rgb(109_94_246/0.7)] transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400">
                  {summary.finished
                    ? "Repasar el curso"
                    : summary.started
                      ? "Continuar"
                      : "Empezar curso"}
                </Link>
              </div>
            )}
          </Container>
        </section>

        <section className="relative isolate bg-canvas py-10 sm:py-14">
          {/* La única textura: puntos ultra tenues a nivel de PÁGINA, no del
              camino. Va en su propia capa para que su máscara no afecte al contenido. */}
          <div aria-hidden className="bp-page-grid absolute inset-0 -z-10" />

          <Container width="wide">
            <RailLayout
              rail={
                <>
                  {needsLogin && (
                    <RailSection title="Tu cuenta" icon={UserRound}>
                      <p className="text-dense leading-5 text-fg-muted">
                        Entra para guardar tu progreso, tu energía y tus tokens, y empezar la
                        primera lección.
                      </p>
                      <div className="mt-3 flex flex-col gap-2">
                        <Link
                          href={routes.login}
                          className="focus-ring inline-flex h-9 items-center justify-center rounded-control bg-brand-500 text-dense font-medium text-white transition-colors hover:bg-brand-600"
                        >
                          Iniciar sesión
                        </Link>
                        <Link
                          href={routes.signup}
                          className="focus-ring inline-flex h-9 items-center justify-center rounded-control border border-line text-dense font-medium transition-colors hover:bg-surface-2"
                        >
                          Crear cuenta gratis
                        </Link>
                      </div>
                    </RailSection>
                  )}

                  <RailSection title="Tu progreso" icon={TrendingUp}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-dense text-fg-muted">
                        {summary.completed} de {summary.total} AC
                      </span>
                      <span className="font-mono text-2xl font-semibold text-learn-ink tabular-nums">
                        {summary.percent}%
                      </span>
                    </div>
                    <ProgressBar
                      value={summary.percent}
                      className="mt-2.5"
                      label={`Progreso de ${course.title}`}
                    />
                    {resume && !summary.finished && (
                      <div className="mt-4">
                        <p className="font-mono text-[10.5px] tracking-[0.18em] text-fg-subtle uppercase">
                          Siguiente
                        </p>
                        <Link
                          href={lessonPath(course.slug, resume.slug)}
                          className="focus-ring group mt-1 inline-flex items-start gap-1.5 rounded-control text-dense font-medium text-fg hover:text-brand-ink"
                        >
                          {resume.title}
                          <ArrowRight
                            aria-hidden
                            className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                        <p className="mt-0.5 font-mono text-label text-fg-subtle tabular-nums">
                          {resume.estimatedMinutes} min
                        </p>
                      </div>
                    )}
                  </RailSection>

                  {/* En pantallas grandes la energía vive en el raíl; en móvil,
                      donde el raíl cae debajo del camino, va arriba de él. */}
                  <div className="hidden lg:contents">
                    <EnergyPanel initial={account} variant="rail" />
                  </div>

                  <RailSection title="Este curso" icon={Route}>
                    <div className="flex flex-col gap-2">
                      <RailStat label="Sectores" value={String(stats.moduleCount)} />
                      <RailStat
                        label={stats.inPreparation ? "Lecciones disponibles" : "Lecciones"}
                        value={
                          stats.inPreparation
                            ? `${stats.readyLessonCount} de ${stats.lessonCount}`
                            : String(stats.lessonCount)
                        }
                      />
                      <RailStat
                        label="Duración"
                        value={formatDuration(stats.inPreparation ? stats.readyMinutes : stats.estimatedMinutes)}
                      />
                      <RailStat label="Lenguaje" value={course.language} />
                    </div>
                  </RailSection>

                  <AdSlot />
                </>
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-xl font-semibold tracking-tight">Tu camino</h2>
                <p className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
                  <BookOpen aria-hidden className="size-3.5" />
                  {stats.lessonCount} nodos
                  <span aria-hidden>·</span>
                  <Clock aria-hidden className="size-3.5" />
                  {formatDuration(stats.estimatedMinutes)}
                </p>
              </div>

              {unavailable && (
                <p
                  role="status"
                  className="mt-4 flex items-start gap-2 text-dense leading-5 text-energy-ink"
                >
                  <DatabaseZap aria-hidden className="mt-0.5 size-4 shrink-0" />
                  No se ha podido leer tu progreso ahora mismo. Se muestra el camino desde el
                  principio; tu avance no se ha perdido.
                  {process.env.NODE_ENV !== "production" && failureKind && (
                    <span className="mt-1 block text-fg-muted">
                      <span className="font-mono text-label tracking-wider uppercase">
                        Solo en desarrollo ·{" "}
                      </span>
                      {adviceFor(failureKind)}
                    </span>
                  )}
                </p>
              )}

              <div className="mt-4 lg:hidden">
                <EnergyPanel initial={account} variant="strip" />
              </div>

              <div className="mt-6">
                <LearningPath modules={modules} account={account} />
              </div>
            </RailLayout>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
