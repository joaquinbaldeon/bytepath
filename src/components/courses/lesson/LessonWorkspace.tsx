"use client";

import { BookOpen, ListChecks } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ChallengeWorkspace } from "@/components/courses/challenge/ChallengeWorkspace";
import { QuizPanel } from "@/components/courses/lesson/QuizPanel";
import type { LessonQuiz, PracticalChallenge } from "@/lib/courses/types";

type Pane = "theory" | "quiz";

/**
 * Armazón de la lección y máquina de etapas.
 *
 *   teoría + quiz  →  desafío (si la lección lo tiene)
 *
 * `theory` llega ya renderizada desde el servidor: este componente solo decide
 * qué etapa se ve y, por debajo de `lg`, cuál de los dos paneles se muestra.
 */
export function LessonWorkspace({
  theory,
  quiz,
  challenge,
  courseSlug,
  lessonSlug,
  isModuleReview,
  coursePath,
  executionAvailable,
  nextHref,
  nextTitle,
}: {
  theory: ReactNode;
  quiz: LessonQuiz | null;
  challenge: PracticalChallenge | null;
  courseSlug: string;
  lessonSlug: string;
  isModuleReview: boolean;
  coursePath: string;
  /** Lo calcula el servidor: si es falso, no hay ejecución real configurada. */
  executionAvailable: boolean;
  nextHref?: string;
  nextTitle?: string;
}) {
  const [pane, setPane] = useState<Pane>("theory");
  const [stage, setStage] = useState<"learn" | "challenge">("learn");

  const tabs: { id: Pane; label: string; icon: typeof BookOpen }[] = [
    { id: "theory", label: "Teoría", icon: BookOpen },
    { id: "quiz", label: "Quiz", icon: ListChecks },
  ];

  if (stage === "challenge" && challenge) {
    return (
      <ChallengeWorkspace
        challenge={challenge}
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
        coursePath={coursePath}
        executionAvailable={executionAvailable}
        nextHref={nextHref}
        nextTitle={nextTitle}
        onBackToTheory={() => setStage("learn")}
      />
    );
  }

  return (
    <div className="lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      {/* Conmutador de panel: solo cuando no caben los dos a la vez */}
      <div className="sticky top-14 z-30 border-b border-line bg-surface/90 px-5 py-2.5 backdrop-blur lg:hidden">
        <div
          role="tablist"
          aria-label="Paneles de la lección"
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={pane === tab.id}
              onClick={() => setPane(tab.id)}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                pane === tab.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
              }`}
            >
              <tab.icon aria-hidden className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:h-full lg:grid-cols-2">
        <section
          aria-label="Teoría"
          className={`${pane === "theory" ? "block" : "hidden"} bg-surface lg:block lg:h-full lg:overflow-y-auto`}
        >
          {theory}
        </section>

        <section
          aria-label="Quiz"
          className={`${pane === "quiz" ? "block" : "hidden"} border-line bg-canvas lg:block lg:h-full lg:overflow-y-auto lg:border-l`}
        >
          {quiz ? (
            <QuizPanel
              quiz={quiz}
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              isModuleReview={isModuleReview}
              coursePath={coursePath}
              nextHref={nextHref}
              nextTitle={nextTitle}
              // Con desafío, el quiz es una etapa intermedia: completa la
              // lección el desafío, no las seis preguntas.
              completesLesson={challenge === null}
              challengeAvailable={challenge !== null}
              onStartChallenge={() => setStage("challenge")}
            />
          ) : (
            <div className="flex min-h-full items-center justify-center px-6 py-16">
              <div className="max-w-xs text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-2">
                  <ListChecks aria-hidden className="size-5 text-fg-subtle" />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">Quiz en preparación</p>
                <p className="mt-2 leading-7 text-fg-muted">
                  Esta lección todavía no tiene sus seis preguntas. Puedes continuar con el resto
                  del curso.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
