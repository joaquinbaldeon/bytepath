"use client";

import { useMemo, useState } from "react";
import { markLessonCompleted } from "@/lib/courses/progress";
import type { PracticalChallenge } from "@/lib/courses/types";
import { getExecutionProvider } from "@/lib/execution";
import type { RunStatus, SubmissionResult, TestOutcome } from "@/lib/execution/types";

export type ChallengeStatus = "idle" | "running" | RunStatus;

/**
 * Estado del desafío práctico. Igual que `useLessonQuiz`: aquí no hay JSX, los
 * componentes solo pintan lo que devuelve este hook.
 *
 * El veredicto **lo decide el servidor**. Este hook no compara salidas ni
 * deduce si la solución es correcta: manda el código y muestra la respuesta.
 * La lección se completa al resolver el desafío, nunca al terminar el quiz.
 */
export function useLessonChallenge(
  challenge: PracticalChallenge,
  { courseSlug, lessonSlug }: { courseSlug: string; lessonSlug: string },
) {
  const provider = useMemo(() => getExecutionProvider(), []);

  const [code, setCode] = useState(challenge.starterCode);
  const [status, setStatus] = useState<ChallengeStatus>("idle");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealedHints, setRevealedHints] = useState(0);

  async function run() {
    setStatus("running");
    setAttempts((value) => value + 1);

    const submission = await provider.submit({
      challengeId: challenge.id,
      language: "cpp",
      source: code,
    });

    setResult(submission);
    setStatus(submission.status);

    // Solo un veredicto explícito del servidor completa la lección.
    if (submission.status === "passed") {
      markLessonCompleted(courseSlug, lessonSlug);
    }
  }

  function reset() {
    setCode(challenge.starterCode);
    setStatus("idle");
    setResult(null);
  }

  /** Caso que se muestra en los paneles: el primero que falla, o el primero. */
  const activeOutcome: TestOutcome | null =
    result?.tests.find((outcome) => outcome.status !== "ok") ?? result?.tests[0] ?? null;

  return {
    code,
    setCode,
    status,
    result,
    run,
    reset,
    attempts,
    activeOutcome,
    hints: challenge.hints ?? [],
    revealedHints,
    revealHint: () => setRevealedHints((value) => value + 1),
  };
}
