"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ChallengeWorkspace } from "@/components/courses/challenge/ChallengeWorkspace";
import { CompletionStatus } from "@/components/courses/lesson/CompletionStatus";
import { LessonContinueBar, type ContinueMode } from "@/components/courses/lesson/LessonContinueBar";
import { QuizModal } from "@/components/courses/lesson/QuizModal";
import { QuizPanel } from "@/components/courses/lesson/QuizPanel";
import {
  checkQuizAnswerAction,
  resetQuizProgressAction,
  saveQuizProgressAction,
  startLessonAction,
} from "@/lib/courses/actions";
import type { LessonProgress } from "@/lib/courses/progress";
import type { QuizSnapshot } from "@/lib/courses/quizProgress";
import type { PracticalChallenge, PublicQuiz } from "@/lib/courses/types";
import { useLessonCompletion } from "@/lib/courses/useLessonCompletion";
import type { AccountState } from "@/lib/energy/types";
import { useLiveAccount } from "@/lib/energy/store";

const notStarted: LessonProgress = {
  quizStatus: "not_started",
  snapshot: null,
  solvedIds: [],
  challengePassed: false,
  completed: false,
};

/**
 * Armazón de la lección.
 *
 *   teoría  →  "Continuar"  →  quiz (modal)  →  desafío (si lo hay)  →  completar
 *
 * La teoría llega ya renderizada desde el servidor. El quiz vive en un modal
 * SOBRE la teoría, no en otra página: la lección sigue debajo, y cerrar el
 * modal es volver a ella sin perder nada. El desafío, en cambio, sigue siendo
 * una etapa completa (enunciado + editor), porque necesita el espacio.
 *
 * Abrir, leer, repasar o hacer el quiz es GRATIS y no depende de la energía.
 * Solo el último paso —completar— gasta 1 ⚡ (salvo Premium), y con 0 ⚡ la
 * lección sigue EN PROGRESO en vez de bloquearse: se puede leer y repasar todo,
 * y se completa cuando vuelve la energía.
 *
 * Este componente no decide nada de eso; lleva el progreso en pantalla y le
 * pide al servidor cada paso:
 *   · empezar la lección (deja la fila de progreso, idempotente y gratis);
 *   · corregir cada pregunta (el servidor corrige y anota el acierto);
 *   · guardar el punto del quiz al pasar de pregunta;
 *   · completar, cuando quiz y desafío están cumplidos. Se intenta solo en el
 *     momento en que se cumple el último requisito, y a mano con el botón si
 *     ese intento fue rechazado (sin energía, sin red...).
 * `persist` es falso cuando no hay dónde guardar (proyecto sin Supabase): el
 * flujo funciona igual, solo que sin memoria.
 */
export function LessonWorkspace({
  theory,
  lessonTitle,
  quiz,
  challenge,
  courseSlug,
  lessonSlug,
  isModuleReview,
  coursePath,
  executionAvailable,
  next,
  persist,
  initialProgress,
  account,
}: {
  theory: ReactNode;
  lessonTitle: string;
  /** Sin respuestas correctas: corregir es cosa del servidor. */
  quiz: PublicQuiz | null;
  challenge: PracticalChallenge | null;
  courseSlug: string;
  lessonSlug: string;
  isModuleReview: boolean;
  coursePath: string;
  /** Lo calcula el servidor: si es falso, no hay ejecución real configurada. */
  executionAvailable: boolean;
  next?: { slug: string; title: string; href: string };
  persist: boolean;
  initialProgress: LessonProgress | null;
  /** Estado de la cuenta tal como lo resolvió el servidor al pedir la página. */
  account: AccountState;
}) {
  const [stage, setStage] = useState<"learn" | "challenge">("learn");
  const [quizOpen, setQuizOpen] = useState(false);
  /** Cambia en cada intento nuevo, para que el quiz se monte limpio y rebaraje. */
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<LessonProgress>(initialProgress ?? notStarted);
  const [busy, setBusy] = useState(false);

  // Publica la cuenta con la que se pidió la página: la barra superior, el
  // camino y esta lección leen todos la misma energía.
  useLiveAccount(account);

  const completion = useLessonCompletion({
    courseSlug,
    lessonSlug,
    initialCompleted: initialProgress?.completed ?? false,
  });
  const { completed, complete } = completion;

  // Abrir la lección la deja EN PROGRESO. Es una petición explícita (un POST) y
  // no un efecto de pintar la página: los prefetch, los refrescos y las
  // pestañas duplicadas no escriben nada. Idempotente y gratis.
  const needsStart = persist && initialProgress === null;
  useEffect(() => {
    if (needsStart) void startLessonAction(courseSlug, lessonSlug);
  }, [needsStart, courseSlug, lessonSlug]);

  const quizDone = quiz === null || progress.quizStatus === "completed";
  const challengeDone = challenge === null || progress.challengePassed;
  const ready = quizDone && challengeDone && !completed;

  function handleQuizProgress(snapshot: QuizSnapshot) {
    // Un repaso del quiz de una lección ya completada, o de un quiz ya
    // superado, no debe reabrir nada (el servidor también lo rechaza).
    if (completed || progress.quizStatus === "completed") return;

    setProgress((previous) => ({
      ...previous,
      quizStatus: "in_progress",
      snapshot,
      solvedIds: Object.entries(snapshot.results)
        .filter(([, result]) => result.solved)
        .map(([id]) => id),
    }));
    if (persist) void saveQuizProgressAction(courseSlug, lessonSlug, snapshot);
  }

  function handleQuizFinish() {
    if (completed) return;
    setProgress((previous) => ({ ...previous, quizStatus: "completed", snapshot: null }));

    // Si el quiz era el último requisito, se intenta completar en el acto. Si
    // se rechaza (sin energía, sin red), la lección queda EN PROGRESO y la
    // barra ofrece completarla a mano.
    if (challenge === null) void complete();
  }

  function handleChallengePassed(recorded: boolean | undefined) {
    // "No se ha podido guardar" no cuenta como superado: el servidor no tiene
    // constancia y `complete_lesson` respondería `challenge_pending`.
    if (recorded === false || completed) return;
    setProgress((previous) => ({ ...previous, challengePassed: true }));
    if (quizDone) void complete();
  }

  function openQuiz(fresh: boolean) {
    if (fresh) setAttempt((value) => value + 1);
    setQuizOpen(true);
  }

  async function resetQuiz() {
    setBusy(true);
    try {
      if (persist) await resetQuizProgressAction(courseSlug, lessonSlug);
      setProgress((previous) => ({
        ...previous,
        quizStatus: "not_started",
        snapshot: null,
        solvedIds: [],
      }));
      openQuiz(true);
    } finally {
      setBusy(false);
    }
  }

  function startChallenge() {
    setQuizOpen(false);
    setStage("challenge");
  }

  if (stage === "challenge" && challenge) {
    return (
      <ChallengeWorkspace
        challenge={challenge}
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
        coursePath={coursePath}
        executionAvailable={executionAvailable}
        next={next}
        completion={completion}
        ready={ready}
        onPassed={handleChallengePassed}
        onBackToTheory={() => setStage("learn")}
      />
    );
  }

  const readOnly = quiz === null && challenge === null;
  const mode: ContinueMode = completed
    ? { kind: "completed", hasQuiz: quiz !== null }
    : ready
      ? { kind: "ready", readOnly }
      : quiz === null
        ? { kind: "challenge_only" }
        : progress.quizStatus === "completed"
          ? { kind: "quiz_passed" }
          : progress.quizStatus === "in_progress" && progress.snapshot
            ? { kind: "resume", solved: progress.solvedIds.length, total: quiz.questions.length }
            : { kind: "fresh" };

  // Un quiz a medias se continúa; en cualquier otro caso empieza limpio.
  const resuming = progress.quizStatus === "in_progress" && progress.snapshot !== null;
  const showStatus = !completed && (ready || completion.problem !== null);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-surface">
      <div className="flex-1">{theory}</div>

      {showStatus && (
        <div className="mx-auto w-full max-w-2xl px-5 pb-5 sm:px-8">
          <CompletionStatus completion={completion} ready={ready} />
        </div>
      )}

      <LessonContinueBar
        mode={mode}
        completion={completion}
        coursePath={coursePath}
        next={next && { title: next.title, href: next.href }}
        busy={busy}
        onOpenQuiz={() => openQuiz(!resuming)}
        onResetQuiz={() => void resetQuiz()}
        onStartChallenge={startChallenge}
      />

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} title={lessonTitle}>
        {quiz && (
          <QuizPanel
            key={attempt}
            quiz={quiz}
            initial={resuming ? progress.snapshot : null}
            isModuleReview={isModuleReview}
            completion={completion}
            completesLesson={challenge === null}
            challengeAvailable={challenge !== null}
            coursePath={coursePath}
            next={next}
            onCheck={(questionId, optionId) =>
              checkQuizAnswerAction(courseSlug, lessonSlug, questionId, optionId)
            }
            onClose={() => setQuizOpen(false)}
            onProgress={handleQuizProgress}
            onFinish={handleQuizFinish}
            onStartChallenge={startChallenge}
          />
        )}
      </QuizModal>
    </div>
  );
}
