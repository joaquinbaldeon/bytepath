import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonHeader } from "@/components/courses/LessonHeader";
import { LessonOutline } from "@/components/courses/LessonOutline";
import { LessonGate } from "@/components/courses/lesson/LessonGate";
import { LessonWorkspace } from "@/components/courses/lesson/LessonWorkspace";
import { TheoryPane } from "@/components/courses/lesson/TheoryPane";
import {
  buildCourseOutline,
  coursePath,
  getAdjacentLessons,
  getCourse,
  getCourseStats,
  getLesson,
  lessonPath,
} from "@/lib/courses/api";
import { getCourseProgress } from "@/lib/courses/progress";
import { readCourseProgress, resolveLessonAccess } from "@/lib/courses/server";
import { toPublicQuiz } from "@/lib/courses/types";
import { readAccountState } from "@/lib/energy/server";
import { adviceFor } from "@/lib/supabase/errors";
import { isJudge0Configured } from "@/lib/execution/judge0";

export async function generateMetadata({
  params,
}: PageProps<"/cursos/[curso]/[leccion]">): Promise<Metadata> {
  const { curso, leccion } = await params;
  const course = getCourse(curso);
  const context = course && getLesson(course, leccion);
  if (!course || !context) return { title: "Página no encontrada · BytePath" };

  return {
    title: `${context.lesson.title} · ${course.title} · BytePath`,
    description: context.lesson.summary ?? course.summary,
  };
}

/**
 * Página de una lección.
 *
 * Es dinámica a propósito. Antes eran 44 páginas estáticas que servían la
 * teoría a cualquiera; ahora el servidor decide en cada visita si quien pide
 * la lección puede verla —con sesión y desbloqueada por progreso— y, si no,
 * devuelve una pantalla de acceso SIN el contenido. No basta con ocultar un
 * botón en el navegador: un cliente manipulado podría pedir la página
 * igualmente, y por eso la teoría misma no sale del servidor hasta que el
 * acceso está concedido.
 *
 * Entrar es gratis y esta página nunca toca la energía: se gasta solo al
 * completar la lección, en una acción aparte (un POST). Del quiz llegan al
 * navegador las preguntas SIN la respuesta correcta.
 */
export default async function LessonPage({ params }: PageProps<"/cursos/[curso]/[leccion]">) {
  const { curso, leccion } = await params;
  const course = getCourse(curso);
  if (!course) notFound();

  const context = getLesson(course, leccion);
  if (!context) notFound();

  const { lesson, module, position } = context;
  const { previous, next } = getAdjacentLessons(course, leccion);
  const stats = getCourseStats(course);
  const moduleIndex = course.modules.findIndex((item) => item.slug === module.slug);

  const [access, { enforce, progress }, account] = await Promise.all([
    resolveLessonAccess(course, lesson),
    readCourseProgress(course.slug),
    readAccountState(),
  ]);

  const summary = getCourseProgress(course, progress);
  const outline = buildCourseOutline(course, progress, enforce);
  const path = coursePath(course.slug);

  return (
    <>
      <LessonHeader
        courseSlug={course.slug}
        courseTitle={course.title}
        position={position}
        total={stats.lessonCount}
        percent={summary.percent}
      />

      <div className="xl:grid xl:grid-cols-[17rem_1fr] xl:items-start">
        <LessonOutline
          modules={outline}
          courseSlug={course.slug}
          courseTitle={course.title}
          currentLessonSlug={lesson.slug}
        />

        {access.status === "open" ? (
          <LessonWorkspace
            theory={
              <TheoryPane
                lesson={lesson}
                module={module}
                moduleIndex={moduleIndex}
                position={position}
                total={stats.lessonCount}
                courseTitle={course.title}
                courseSlug={course.slug}
                coursePath={path}
                previous={previous}
              />
            }
            lessonTitle={lesson.title}
            quiz={lesson.quiz ? toPublicQuiz(lesson.quiz) : null}
            challenge={lesson.challenge}
            courseSlug={course.slug}
            lessonSlug={lesson.slug}
            isModuleReview={lesson.kind === "quiz"}
            coursePath={path}
            executionAvailable={isJudge0Configured()}
            next={
              next && {
                slug: next.lesson.slug,
                title: next.lesson.title,
                href: lessonPath(course.slug, next.lesson.slug),
              }
            }
            persist={access.persist}
            initialProgress={access.progress}
            account={account}
          />
        ) : access.status === "signin" ? (
          <LessonGate status="signin" coursePath={path} />
        ) : access.status === "locked" ? (
          <LessonGate
            status="locked"
            coursePath={path}
            prerequisite={{
              title: access.prerequisite.title,
              href: lessonPath(course.slug, access.prerequisite.slug),
            }}
          />
        ) : (
          <LessonGate
            status="unavailable"
            coursePath={path}
            hint={
              process.env.NODE_ENV !== "production" && access.failureKind
                ? adviceFor(access.failureKind)
                : undefined
            }
          />
        )}
      </div>
    </>
  );
}
