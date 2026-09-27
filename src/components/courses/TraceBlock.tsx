"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/courses/CodeBlock";
import type { CodeTrace } from "@/lib/courses/types";

export function TraceBlock({ block }: { block: CodeTrace }) {
  const [step, setStep] = useState(0);
  const current = block.steps[step];
  const isLast = step === block.steps.length - 1;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-sm font-semibold">
          {block.title ?? "Ejecuta el código paso a paso"}
        </p>
        <p className="font-mono text-[11px] text-fg-subtle">
          Paso {step + 1} de {block.steps.length}
        </p>
      </div>

      <CodeBlock code={block.code} highlightLine={current.line} className="mt-4" />

      <p className="mt-4 leading-7 text-fg-body">{current.explanation}</p>

      {current.variables && current.variables.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
            Variables
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {current.variables.map((variable) => (
              <li
                key={variable.name}
                className="rounded-lg border border-learn/30 bg-learn-soft px-3 py-1.5 font-mono text-[13px]"
              >
                <span className="text-fg-muted">{variable.name}</span>
                <span className="text-fg-subtle"> = </span>
                <span className="font-medium text-learn-ink">{variable.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {current.output && (
        <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2">
          <p className="font-mono text-[11px] tracking-wider text-fg-subtle uppercase">Salida</p>
          <pre className="mt-1 font-mono text-[13px] whitespace-pre text-fg-body">
            {current.output}
          </pre>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {block.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-learn" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-sm font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft aria-hidden className="size-4" />
            Anterior
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              <RotateCcw aria-hidden className="size-4" />
              Reiniciar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(block.steps.length - 1, s + 1))}
              className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control bg-fg px-3 text-sm font-medium text-canvas transition-colors hover:bg-fg/90"
            >
              Siguiente
              <ChevronRight aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
