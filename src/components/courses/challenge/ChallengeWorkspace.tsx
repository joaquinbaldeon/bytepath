"use client";

import { Code, FileText } from "lucide-react";
import { useState } from "react";
import { ChallengeBrief } from "@/components/courses/challenge/ChallengeBrief";
import { ChallengeEditor } from "@/components/courses/challenge/ChallengeEditor";
import { ChallengeResult } from "@/components/courses/challenge/ChallengeResult";
import { OutputComparison } from "@/components/courses/challenge/OutputComparison";
import type { PracticalChallenge } from "@/lib/courses/types";
import { useLessonChallenge } from "@/lib/courses/useLessonChallenge";

type Pane = "brief" | "editor";

export function ChallengeWorkspace({
  challenge,
  courseSlug,
  lessonSlug,
  coursePath,
  executionAvailable,
  nextHref,
  nextTitle,
  onBackToTheory,
}: {
  challenge: PracticalChallenge;
  courseSlug: string;
  lessonSlug: string;
  coursePath: string;
  executionAvailable: boolean;
  nextHref?: string;
  nextTitle?: string;
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
  } = useLessonChallenge(challenge, { courseSlug, lessonSlug });

  const tabs: { id: Pane; label: string; icon: typeof Code }[] = [
    { id: "brief", label: "Desafío", icon: FileText },
    { id: "editor", label: "Código", icon: Code },
  ];

  const solved = status === "passed";
  const expectedPreview = challenge.examples?.[0]?.output;

  return (
    <div className="lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      <div className="sticky top-14 z-30 border-b border-line bg-surface/90 px-5 py-2.5 backdrop-blur lg:hidden">
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
          aria-label="Desafío"
          className={`${pane === "brief" ? "block" : "hidden"} bg-surface lg:block lg:h-full lg:overflow-y-auto`}
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
          className={`${pane === "editor" ? "flex" : "hidden"} min-h-0 flex-col border-line bg-canvas lg:flex lg:h-full lg:border-l`}
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
            className="lg:min-h-0 lg:flex-1"
          />

          <div className="min-h-64 border-t border-line lg:h-[44%] lg:min-h-0">
            {solved && showResult ? (
              <ChallengeResult
                attempts={attempts}
                nextHref={nextHref}
                nextTitle={nextTitle}
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
