import { BookOpen, Clock, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { CourseCard } from "@/components/courses/CourseCard";
import { NextStepCard } from "@/components/courses/NextStepCard";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { CodeMotto } from "@/components/ui/CodeMotto";
import { Container } from "@/components/ui/Container";
import { RailCard } from "@/components/ui/RailCard";
import { RailLayout } from "@/components/ui/RailLayout";
import { formatDuration, getCourses, getCourseStats, lessonPath } from "@/lib/courses/api";
import { getCourseProgress, getResumeLesson } from "@/lib/courses/progress";
import { readAllCoursesProgress } from "@/lib/courses/server";
import { ENERGY_REGEN_HOURS } from "@/lib/energy/config";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

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
  const nextProgress = next ? getCourseProgress(next, byCourse(next.slug)) : null;

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
            <p className="font-mono text-label text-learn">{"// 01 · aprende"}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Cursos
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
              Lecciones cortas, a tu ritmo: lees la idea, la compruebas con un quiz y la pones a
              prueba con código que se compila de verdad. Sin prisa y sin letra pequeña.
            </p>
          </Container>
        </section>

        <section className="bg-canvas py-10 sm:py-12">
          <Container width="wide">
            <RailLayout
              rail={
                <>
                  <RailCard title="Cómo es una lección" icon={ListChecks}>
                    <ol className="flex flex-col gap-2.5 text-dense text-fg-muted">
                      {[
                        ["Teoría", "la idea, corta y con ejemplos"],
                        ["Quiz", "seis preguntas para comprobarla"],
                        ["Desafío", "tu código, compilado y evaluado"],
                        ["Completar", `−1 ⚡ y +${LESSON_COMPLETION_REWARD} tokens`],
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
                    <p className="mt-3 text-label leading-4 text-fg-subtle">
                      La energía vuelve sola (+1 cada {ENERGY_REGEN_HOURS} h). Los tokens sirven para no esperar:
                      con {ENERGY_REFILL_COST} la llenas de golpe.
                    </p>
                    <CodeMotto className="mt-3.5 rounded-control bg-code px-3 py-2.5" />
                  </RailCard>

                  {/* Última tarjeta del raíl, y la única prescindible: las de
                      arriba siguen teniendo sentido sin esta. */}
                  <AdSlot />
                </>
              }
            >
              {next && nextLesson && nextProgress && (
                <div className="mb-8">
                  <NextStepCard
                    started={nextProgress.started}
                    courseTitle={next.title}
                    lessonTitle={nextLesson.title}
                    lessonMinutes={nextLesson.estimatedMinutes}
                    href={lessonPath(next.slug, nextLesson.slug)}
                    completed={nextProgress.completed}
                    total={nextProgress.total}
                    percent={nextProgress.percent}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-semibold">Todos los cursos</h2>
                <p className="inline-flex flex-wrap items-center gap-1.5 text-dense text-fg-muted">
                  <BookOpen aria-hidden className="size-4 text-fg-subtle" />
                  {courses.length} {courses.length === 1 ? "curso" : "cursos"} · {totals.lessons}{" "}
                  lecciones
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
