"use client";

import { Check, X } from "lucide-react";
import { CodeBlock } from "@/components/courses/CodeBlock";
import { questionKindLabels } from "@/lib/courses/labels";
import type { PublicQuizQuestion } from "@/lib/courses/types";
import type { AnswerState } from "@/lib/courses/useLessonQuiz";

export function QuizQuestionCard({
  question,
  answer,
  options,
  onSelect,
}: {
  question: PublicQuizQuestion;
  answer: AnswerState;
  /** Opciones de `question`, ya en el orden barajado para este intento. */
  options: PublicQuizQuestion["options"];
  onSelect: (optionId: string) => void;
}) {
  const showFeedback = answer.checked;

  return (
    <div>
      <p className="font-mono text-[11px] tracking-wider text-learn-ink uppercase sm:text-xs">
        {questionKindLabels[question.kind]}
      </p>
      <h2 className="mt-2 text-xl leading-8 font-medium sm:mt-3 sm:text-2xl sm:leading-9">{question.prompt}</h2>

      {question.code && <CodeBlock code={question.code} className="mt-5 sm:mt-6" />}

      <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-3.5">
        {options.map((option) => {
          const selected = answer.selected === option.id;
          // El servidor solo confirma la respuesta correcta al acertarla: si la
          // opción marcada está corregida como acierto, es la respuesta.
          const isAnswer = selected && answer.solved;

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
                disabled={answer.checked}
                aria-pressed={selected}
                className={`focus-ring flex w-full items-start gap-3.5 rounded-card border px-4 py-3.5 text-left text-base leading-7 transition-colors disabled:cursor-default sm:gap-4 sm:px-5 sm:py-4 ${state}`}
              >
                <span
                  className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border sm:size-6 ${
                    selected ? "border-learn bg-learn" : "border-line"
                  }`}
                >
                  {selected && <span className="size-1.5 rounded-full bg-white sm:size-2" />}
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
          className={`mt-6 rounded-xl border px-4 py-4 sm:px-5 ${
            answer.solved
              ? "border-practice/40 bg-practice-soft"
              : "border-hard/40 bg-danger-soft"
          }`}
        >
          <p
            className={`text-sm font-semibold sm:text-base ${
              answer.solved ? "text-practice-ink" : "text-danger-ink"
            }`}
          >
            {answer.solved ? "¡Correcto!" : "Esta no era"}
          </p>
          <p className="mt-1 text-sm leading-6 text-fg-muted sm:text-base sm:leading-7">
            {answer.solved
              ? answer.explanation
              : "Sin problema: vuelve al final del quiz para que la intentes otra vez."}
          </p>
        </div>
      )}
    </div>
  );
}
