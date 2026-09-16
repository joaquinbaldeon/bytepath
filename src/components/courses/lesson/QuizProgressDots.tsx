"use client";

import type { QuestionProgress } from "@/lib/courses/useLessonQuiz";

const styles: Record<QuestionProgress, string> = {
  solved: "bg-practice",
  "solved-with-errors": "bg-compete",
  current: "bg-learn ring-4 ring-learn/20",
  pending: "bg-line",
};

const labels: Record<QuestionProgress, string> = {
  solved: "resuelta",
  "solved-with-errors": "resuelta tras fallar",
  current: "actual",
  pending: "pendiente",
};

export function QuizProgressDots({
  total,
  progressOf,
  onSelect,
}: {
  total: number;
  progressOf: (index: number) => QuestionProgress;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const state = progressOf(i);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Pregunta ${i + 1}: ${labels[state]}`}
              aria-current={state === "current" ? "step" : undefined}
              className={`block size-2.5 rounded-full transition-all hover:scale-125 ${styles[state]}`}
            />
          </li>
        );
      })}
    </ol>
  );
}
