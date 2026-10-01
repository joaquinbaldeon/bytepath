import { Check } from "lucide-react";

export type LessonStep = {
  id: "theory" | "quiz" | "challenge" | "complete";
  label: string;
  state: "done" | "current" | "todo";
};

/**
 * Dónde estás DENTRO de la lección: Teoría · Quiz · Desafío · Completar.
 *
 * Responde a "¿cuánto me falta?" sin tener que abrir nada. Solo aparecen los
 * pasos que la lección tiene (una lección sin desafío no enseña ese paso), y
 * el estado sale del progreso que ya lleva el espacio de trabajo: esto solo
 * lo dibuja.
 */
export function LessonSteps({ steps, className = "" }: { steps: LessonStep[]; className?: string }) {
  const current = steps.findIndex((step) => step.state === "current");

  return (
    <ol
      aria-label={
        current >= 0
          ? `Paso ${current + 1} de ${steps.length}: ${steps[current].label}`
          : "Todos los pasos completados"
      }
      className={`flex items-center gap-1 font-mono text-[10.5px] tracking-wider uppercase ${className}`}
    >
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-center gap-1">
          {index > 0 && (
            <span
              aria-hidden
              className={`h-px w-1.5 sm:w-4 ${step.state === "todo" ? "bg-line" : "bg-practice/60"}`}
            />
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 sm:px-2 ${
              step.state === "done"
                ? "bg-practice-soft text-practice-ink"
                : step.state === "current"
                  ? "bg-brand-500 text-white"
                  : "text-fg-subtle"
            }`}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            {step.state === "done" && <Check aria-hidden className="size-3" strokeWidth={3} />}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Pasos de una lección según qué tiene y hasta dónde ha llegado. */
export function lessonSteps({
  hasQuiz,
  hasChallenge,
  theoryDone,
  quizDone,
  challengeDone,
  completed,
}: {
  hasQuiz: boolean;
  hasChallenge: boolean;
  /** Ya ha pasado de la teoría: quiz empezado, desafío abierto o superado. */
  theoryDone: boolean;
  quizDone: boolean;
  challengeDone: boolean;
  completed: boolean;
}): LessonStep[] {
  const steps: Omit<LessonStep, "state">[] = [{ id: "theory", label: "Teoría" }];
  if (hasQuiz) steps.push({ id: "quiz", label: "Quiz" });
  if (hasChallenge) steps.push({ id: "challenge", label: "Desafío" });
  steps.push({ id: "complete", label: "Completar" });

  // El primer paso sin cumplir es el actual.
  const done = (id: LessonStep["id"]): boolean => {
    if (completed) return true;
    switch (id) {
      case "theory":
        return theoryDone || quizDone || challengeDone;
      case "quiz":
        return quizDone;
      case "challenge":
        return challengeDone;
      case "complete":
        return false;
    }
  };

  let currentAssigned = false;
  return steps.map((step) => {
    if (done(step.id)) return { ...step, state: "done" };
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...step, state: "current" };
    }
    return { ...step, state: "todo" };
  });
}
