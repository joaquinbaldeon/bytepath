import { BookOpen, Clock, Compass, ListChecks, Route } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { CourseCard } from "@/components/courses/CourseCard";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/Container";
import { RailCard, RailStat } from "@/components/ui/RailCard";
import { RailLayout } from "@/components/ui/RailLayout";
import { formatDuration, getCourses, getCourseStats, lessonPath } from "@/lib/courses/api";
import { getCourseProgress, getResumeLesson } from "@/lib/courses/progress";
import { readAllCoursesProgress } from "@/lib/courses/server";

export const metadata: Metadata = {
  title: "Cursos · BytePath",
  description:
    "Cursos guiados de C++ y programación competitiva: teoría breve, ejemplos y ejercicios, módulo a módulo.",
};

/**
 * Catálogo. Es dinámico porque las tarjetas y el raíl enseñan el progreso real
 * de quien mira, que sale de la base de datos.
 */
export default async function CoursesPage() {
  const courses = getCourses();
  const { byCourse } = await readAllCoursesProgress();

  // Totales del catálogo, para que el raíl diga de qué tamaño es el camino.
  // Solo cuenta lo que ya tiene contenido: las lecciones en preparación no
  // inflan el número.
  const totals = courses.reduce(
    (acc, course) => {
      const stats = getCourseStats(course);
      return {
        lessons: acc.lessons + stats.readyLessonCount,
        minutes: acc.minutes + stats.readyMinutes,
      };
    },
    { lessons: 0, minutes: 0 },
  );

  // Por dónde seguir: el primer curso empezado y sin terminar, o el primero.
  const inProgress = courses.find((course) => {
    const progress = getCourseProgress(course, byCourse(course.slug));
    return progress.started && !progress.finished;
  });
  const next = inProgress ?? courses[0];
  const nextLesson = next ? getResumeLesson(next, byCourse(next.slug)) : undefined;
  const nextStarted = next ? getCourseProgress(next, byCourse(next.slug)).started : false;

  return (
    <>
      <Navbar />
      <main>
        {/* Cabecera comprimida: antes gastaba 240px de padding para mostrar un
            título y un párrafo, y se comía la primera pantalla entera. */}
        <section className="relative isolate overflow-hidden bg-night-900 pt-24 pb-10 text-white sm:pt-28 sm:pb-12">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <Container width="wide">
            <p className="font-mono text-label tracking-[0.2em] text-learn uppercase">
              01 · Aprende
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Cursos
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
              Rutas divididas en módulos y lecciones cortas. Lees la teoría, la compruebas con un
              quiz y la afianzas escribiendo código que se compila de verdad.
            </p>
          </Container>
        </section>

        <section className="bg-canvas py-10 sm:py-12">
          <Container width="wide">
            <RailLayout
              rail={
                <>
                  <RailCard title="Tu ruta" icon={Compass}>
                    <div className="flex flex-col gap-2">
                      <RailStat label="Cursos" value={String(courses.length)} />
                      <RailStat label="Lecciones disponibles" value={String(totals.lessons)} />
                      <RailStat label="Duración" value={formatDuration(totals.minutes)} />
                    </div>
                  </RailCard>

                  {next && nextLesson && (
                    <RailCard title={nextStarted ? "Continuar" : "Empieza por aquí"} icon={Route}>
                      <p className="text-dense text-fg-muted">{next.title}</p>
                      <p className="mt-1 font-medium">{nextLesson.title}</p>
                      <div className="mt-3 flex flex-col">
                        <Link href={lessonPath(next.slug, nextLesson.slug)} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-control bg-brand-500 text-dense font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400">
                          {nextStarted ? "Retomar" : "Empezar"}
                        </Link>
                      </div>
                    </RailCard>
                  )}

                  <RailCard title="Cómo es una lección" icon={ListChecks}>
                    <ol className="flex flex-col gap-2.5 text-dense text-fg-muted">
                      {[
                        ["Teoría", "explicación breve con ejemplos"],
                        ["Quiz", "seis preguntas para comprobar"],
                        ["Desafío", "código que se compila y se evalúa"],
                      ].map(([step, detail], i) => (
                        <li key={step} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[10px] text-fg-subtle"
                          >
                            {i + 1}
                          </span>
                          <span>
                            <span className="font-medium text-fg">{step}</span>: {detail}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </RailCard>

                  {/* Última tarjeta del raíl, y la única prescindible: las de
                      arriba siguen teniendo sentido sin esta. */}
                  <AdSlot />
                </>
              }
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold">Catálogo</h2>
                <p className="inline-flex items-center gap-1.5 text-dense text-fg-muted">
                  <BookOpen aria-hidden className="size-4 text-fg-subtle" />
                  {courses.length} {courses.length === 1 ? "curso" : "cursos"}
                  <span aria-hidden className="text-fg-subtle">
                    ·
                  </span>
                  <Clock aria-hidden className="size-4 text-fg-subtle" />
                  {formatDuration(totals.minutes)}
                </p>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.slug} course={course} progress={byCourse(course.slug)} />
                ))}
              </div>
            </RailLayout>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
