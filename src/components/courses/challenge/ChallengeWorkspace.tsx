"use client";

import { Code, FileText, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ChallengeBrief } from "@/components/courses/challenge/ChallengeBrief";
import { ChallengeEditor } from "@/components/courses/challenge/ChallengeEditor";
import { ChallengeResult } from "@/components/courses/challenge/ChallengeResult";
import { OutputComparison } from "@/components/courses/challenge/OutputComparison";
import type { PracticalChallenge } from "@/lib/courses/types";
import { useLessonChallenge } from "@/lib/courses/useLessonChallenge";
import type { LessonCompletion } from "@/lib/courses/useLessonCompletion";
import type { NextLesson } from "@/components/courses/challenge/ChallengeResult";

type Pane = "brief" | "editor";

export function ChallengeWorkspace({
  challenge,
  courseSlug,
  lessonSlug,
  coursePath,
  executionAvailable,
  next,
  completion,
  ready,
  onPassed,
  onBackToTheory,
}: {
  challenge: PracticalChallenge;
  courseSlug: string;
  lessonSlug: string;
  coursePath: string;
  executionAvailable: boolean;
  next?: NextLesson;
  /** Cómo va el cierre de la lección (la lleva el espacio de trabajo). */
  completion: LessonCompletion;
  /** Quiz y desafío cumplidos, lección aún sin completar. */
  ready: boolean;
  /** El juez ha dado la solución por buena; `recorded` dice si el servidor ha podido anotarlo. */
  onPassed: (recorded: boolean | undefined) => void;
  onBackToTheory: () => void;
}) {
  const [pane, setPane] = useState<Pane>("brief");
  const [showResult, setShowResult] = useState(true);

  const {
    code,
    setCode,
    status,
    result,
    run,
    reset,
    attempts,
    activeOutcome,
    hints,
    revealedHints,
    revealHint,
  } = useLessonChallenge(challenge, { courseSlug, lessonSlug, onPassed });

  const tabs: { id: Pane; label: string; icon: typeof Code }[] = [
    { id: "brief", label: "Desafío", icon: FileText },
    { id: "editor", label: "Código", icon: Code },
  ];

  const solved = status === "passed";
  // Correcta, pero el servidor no ha podido dejar constancia: no cuenta como
  // resuelto hasta que se vuelva a ejecutar con éxito.
  const saveFailed = solved && result?.recorded === false;
  const expectedPreview = challenge.examples?.[0]?.output;

  return (
    <div className="xl:h-[calc(100dvh-3.5rem)] xl:overflow-hidden">
      <div className="sticky top-14 z-30 border-b border-line bg-surface/90 px-5 py-2.5 backdrop-blur xl:hidden">
        <div
          role="tablist"
          aria-label="Paneles del desafío"
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={pane === tab.id}
              onClick={() => setPane(tab.id)}
              className={`focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors ${
                pane === tab.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
              }`}
            >
              <tab.icon aria-hidden className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="xl:grid xl:h-full xl:grid-cols-2">
        <section
          aria-label="Desafío"
          className={`${pane === "brief" ? "block" : "hidden"} bg-surface xl:block xl:h-full xl:overflow-y-auto`}
        >
          <ChallengeBrief
            challenge={challenge}
            hints={hints}
            revealedHints={revealedHints}
            onRevealHint={revealHint}
            onBackToTheory={onBackToTheory}
          />
        </section>

        <section
          aria-label="Editor de código"
          className={`${pane === "editor" ? "flex" : "hidden"} min-h-0 flex-col border-line bg-canvas xl:flex xl:h-full xl:border-l`}
        >
          <ChallengeEditor
            code={code}
            onChange={setCode}
            onRun={() => {
              setShowResult(true);
              void run();
            }}
            onReset={reset}
            status={status}
            executionAvailable={executionAvailable}
            className="xl:min-h-0 xl:flex-1"
          />

          <div className="min-h-64 border-t border-line xl:h-[44%] xl:min-h-0">
            {saveFailed ? (
              <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-energy-soft">
                  <TriangleAlert aria-hidden className="size-6 text-energy-ink" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">
                  Tu solución es correcta, pero no se ha podido guardar
                </h3>
                <p className="mt-2 max-w-sm leading-7 text-fg-muted">
                  El servidor no ha podido dejar constancia del desafío, así que la lección todavía
                  no se puede completar. Tu código sigue aquí: vuelve a ejecutarlo en un momento.
                </p>
              </div>
            ) : solved && showResult ? (
              <ChallengeResult
                attempts={attempts}
                completion={completion}
                ready={ready}
                next={next}
                coursePath={coursePath}
                onKeepEditing={() => setShowResult(false)}
              />
            ) : (
              <OutputComparison
                status={status}
                result={result}
                outcome={activeOutcome}
                expectedOutput={expectedPreview}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
