import type { Metadata } from "next";
import { CourseCard } from "@/components/courses/CourseCard";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/Container";
import { getCourses } from "@/lib/courses/api";

export const metadata: Metadata = {
  title: "Cursos · BytePath",
  description:
    "Cursos guiados de C++ y programación competitiva: teoría breve, ejemplos y ejercicios, módulo a módulo.",
};

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <>
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-night-900 pt-32 pb-16 text-white sm:pt-40 sm:pb-20">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <Container>
            <p className="font-mono text-xs tracking-[0.2em] text-learn uppercase">01 · Aprende</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Cursos
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              Rutas de aprendizaje divididas en módulos y lecciones cortas. Lees la teoría, la
              pruebas con ejemplos y la afianzas con un quiz antes de seguir.
            </p>
          </Container>
        </section>

        <section className="bg-canvas py-16 sm:py-20">
          <Container>
            <div className="grid gap-5 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
