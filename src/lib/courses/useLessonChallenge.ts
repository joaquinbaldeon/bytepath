"use client";

import { useMemo, useState } from "react";
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
 *
 * Resolver el desafío NO completa la lección por sí solo. Cuando el juez da el
 * veredicto "passed", el servidor deja constancia (`record_challenge_pass`, en
 * `/api/runs`) y avisa con `recorded`; a partir de ahí completar la lección
 * es otra petición, atómica, que vuelve a comprobarlo todo y es la que gasta la
 * energía. Aquí solo se avisa de que el desafío está resuelto (`onPassed`).
 */
export function useLessonChallenge(
  challenge: PracticalChallenge,
  {
    courseSlug,
    lessonSlug,
    onPassed,
  }: {
    courseSlug: string;
    lessonSlug: string;
    /**
     * El juez ha dado la solución por buena. `recorded` dice si el servidor ha
     * podido dejar constancia (`undefined` cuando no hay cuenta donde hacerlo).
     */
    onPassed?: (recorded: boolean | undefined) => void;
  },
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
      courseSlug,
      lessonSlug,
    });

    setResult(submission);
    setStatus(submission.status);

    // Solo un veredicto explícito del servidor cuenta como desafío resuelto.
    if (submission.status === "passed") onPassed?.(submission.recorded);
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
