"use client";

import { ArrowLeft, Lightbulb } from "lucide-react";
import { LessonBlocks } from "@/components/courses/LessonBlocks";
import { type LessonStep, LessonSteps } from "@/components/courses/lesson/LessonSteps";
import type { PracticalChallenge } from "@/lib/courses/types";

export function ChallengeBrief({
  challenge,
  steps,
  hints,
  revealedHints,
  onRevealHint,
  onBackToTheory,
}: {
  challenge: PracticalChallenge;
  steps: LessonStep[];
  hints: string[];
  revealedHints: number;
  onRevealHint: () => void;
  onBackToTheory: () => void;
}) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToTheory}
          className="focus-ring inline-flex items-center gap-1.5 rounded-control text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Volver a la teoría
        </button>
        <LessonSteps steps={steps} />
      </div>

      <p className="mt-6 font-mono text-[11px] tracking-wider text-compete-ink uppercase">
        Desafío práctico
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {challenge.title}
      </h1>

      <div className="mt-6">
        <LessonBlocks blocks={challenge.statement} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold">Qué debe hacer tu programa</h2>
        <ol className="mt-3 space-y-2">
          {challenge.instructions.map((instruction, i) => (
            <li key={instruction} className="flex gap-3 text-[15px] leading-7 text-fg-body">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-compete-soft font-mono text-[11px] font-semibold text-compete-ink">
                {i + 1}
              </span>
              {instruction}
            </li>
          ))}
        </ol>
      </section>

      {challenge.requirements && challenge.requirements.length > 0 && (
        <section className="mt-7">
          <h2 className="font-display text-sm font-semibold">Requisitos</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-fg-body marker:text-compete">
            {challenge.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </section>
      )}

      {challenge.examples && challenge.examples.length > 0 && (
        <section className="mt-7">
          <h2 className="font-display text-sm font-semibold">Ejemplo</h2>
          <div className="mt-3 space-y-3">
            {challenge.examples.map((example, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-line">
                {example.input !== undefined && (
                  <div className="border-b border-line">
                    <p className="bg-surface-2 px-4 py-2 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
                      Entrada
                    </p>
                    <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] whitespace-pre text-fg-body">
                      {example.input}
                    </pre>
                  </div>
                )}
                <p className="bg-surface-2 px-4 py-2 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
                  Salida
                </p>
                <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] whitespace-pre text-fg-body">
                  {example.output}
                </pre>
                {example.explanation && (
                  <p className="border-t border-line px-4 py-3 text-sm leading-6 text-fg-muted">
                    {example.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hints.length > 0 && (
        <section className="mt-7">
          <h2 className="font-display text-sm font-semibold">Pistas</h2>
          <ul className="mt-3 space-y-2">
            {hints.slice(0, revealedHints).map((hint) => (
              <li
                key={hint}
                className="flex gap-3 rounded-xl border border-brand-500/25 bg-brand-soft px-4 py-3 text-[15px] leading-7 text-fg-body"
              >
                <Lightbulb aria-hidden className="mt-1 size-4 shrink-0 text-brand-ink" />
                {hint}
              </li>
            ))}
          </ul>
          {revealedHints < hints.length && (
            <button
              type="button"
              onClick={onRevealHint}
              className="focus-ring mt-3 inline-flex h-9 items-center gap-2 rounded-control border border-line px-3 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <Lightbulb aria-hidden className="size-4 text-brand-ink" />
              {revealedHints === 0
                ? "Ver una pista"
                : `Ver otra pista (${hints.length - revealedHints} restantes)`}
            </button>
          )}
        </section>
      )}
    </article>
  );
}
