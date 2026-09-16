import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonHeader } from "@/components/courses/LessonHeader";
import { LessonOutline } from "@/components/courses/LessonOutline";
import { LessonWorkspace } from "@/components/courses/lesson/LessonWorkspace";
import { TheoryPane } from "@/components/courses/lesson/TheoryPane";
import {
  buildCourseOutline,
  coursePath,
  getAdjacentLessons,
  getCourse,
  getCourseLessons,
  getCourses,
  getCourseStats,
  getLesson,
  lessonPath,
} from "@/lib/courses/api";
import { getCourseProgress } from "@/lib/courses/progress";
import { isJudge0Configured } from "@/lib/execution/judge0";

export function generateStaticParams() {
  return getCourses().flatMap((course) =>
    getCourseLessons(course).map(({ lesson }) => ({
      curso: course.slug,
      leccion: lesson.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/cursos/[curso]/[leccion]">): Promise<Metadata> {
  const { curso, leccion } = await params;
  const course = getCourse(curso);
  const context = course && getLesson(course, leccion);
  if (!course || !context) return {};

  return {
    title: `${context.lesson.title} · ${course.title} · BytePath`,
    description: context.lesson.summary ?? course.summary,
  };
}

export default async function LessonPage({ params }: PageProps<"/cursos/[curso]/[leccion]">) {
  const { curso, leccion } = await params;
  const course = getCourse(curso);
  if (!course) notFound();

  const context = getLesson(course, leccion);
  if (!context) notFound();

  const { lesson, module, position } = context;
  const { previous, next } = getAdjacentLessons(course, leccion);
  const stats = getCourseStats(course);
  const progress = getCourseProgress(course);
  const outline = buildCourseOutline(course);
  const moduleIndex = course.modules.findIndex((item) => item.slug === module.slug);

  return (
    <>
      <LessonHeader
        courseSlug={course.slug}
        courseTitle={course.title}
        position={position}
        total={stats.lessonCount}
        percent={progress.percent}
      />

      <div className="xl:grid xl:grid-cols-[17rem_1fr] xl:items-start">
        <LessonOutline
          modules={outline}
          courseSlug={course.slug}
          courseTitle={course.title}
          currentLessonSlug={lesson.slug}
        />

        <LessonWorkspace
          theory={
            <TheoryPane
              lesson={lesson}
              module={module}
              moduleIndex={moduleIndex}
              position={position}
              total={stats.lessonCount}
              courseSlug={course.slug}
              previous={previous}
              next={next}
            />
          }
          quiz={lesson.quiz}
          challenge={lesson.challenge}
          courseSlug={course.slug}
          lessonSlug={lesson.slug}
          isModuleReview={lesson.kind === "quiz"}
          coursePath={coursePath(course.slug)}
          executionAvailable={isJudge0Configured()}
          nextHref={next && lessonPath(course.slug, next.lesson.slug)}
          nextTitle={next?.lesson.title}
        />
      </div>
    </>
  );
}
