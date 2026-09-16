"use client";

import { Check, X } from "lucide-react";
import { CodeBlock } from "@/components/courses/CodeBlock";
import { questionKindLabels } from "@/lib/courses/api";
import type { QuizQuestion } from "@/lib/courses/types";
import type { AnswerState } from "@/lib/courses/useLessonQuiz";

export function QuizQuestionCard({
  question,
  answer,
  onSelect,
}: {
  question: QuizQuestion;
  answer: AnswerState;
  onSelect: (optionId: string) => void;
}) {
  const showFeedback = answer.checked;

  return (
    <div>
      <p className="font-mono text-[11px] tracking-wider text-learn-ink uppercase">
        {questionKindLabels[question.kind]}
      </p>
      <h2 className="mt-2 text-lg leading-7 font-medium">{question.prompt}</h2>

      {question.code && <CodeBlock code={question.code} className="mt-4" />}

      <ul className="mt-5 space-y-2.5">
        {question.options.map((option) => {
          const selected = answer.selected === option.id;
          const isAnswer = option.id === question.correctOptionId;

          let state = "border-line bg-surface hover:bg-surface-2";
          if (showFeedback && selected && isAnswer) {
            state = "border-practice/60 bg-practice-soft";
          } else if (showFeedback && selected) {
            state = "border-hard/60 bg-danger-soft";
          } else if (selected) {
            state = "border-learn/60 bg-learn-soft";
          }

          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                disabled={answer.solved}
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-6 transition-colors disabled:cursor-default ${state}`}
              >
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                    selected ? "border-learn bg-learn" : "border-line"
                  }`}
                >
                  {selected && <span className="size-1.5 rounded-full bg-white" />}
                </span>
                <span className="flex-1">{option.text}</span>
                {showFeedback && selected && (
                  <span className="mt-0.5 shrink-0">
                    {isAnswer ? (
                      <Check aria-hidden className="size-4 text-practice-ink" strokeWidth={3} />
                    ) : (
                      <X aria-hidden className="size-4 text-danger-ink" strokeWidth={3} />
                    )}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {showFeedback && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3.5 ${
            answer.solved
              ? "border-practice/40 bg-practice-soft"
              : "border-hard/40 bg-danger-soft"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              answer.solved ? "text-practice-ink" : "text-danger-ink"
            }`}
          >
            {answer.solved ? "¡Correcto!" : "No es la respuesta correcta"}
          </p>
          <p className="mt-1 text-sm leading-6 text-fg-muted">
            {answer.solved
              ? question.explanation
              : "Vuelve a la teoría de la izquierda si lo necesitas y prueba con otra opción."}
          </p>
        </div>
      )}
    </div>
  );
}
