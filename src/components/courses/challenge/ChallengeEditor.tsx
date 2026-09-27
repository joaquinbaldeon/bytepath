"use client";

import { Play, RotateCcw } from "lucide-react";
import { CodeEditor } from "@/components/courses/challenge/CodeEditor";
import type { ChallengeStatus } from "@/lib/courses/useLessonChallenge";

export function ChallengeEditor({
  code,
  onChange,
  onRun,
  onReset,
  status,
  executionAvailable,
  className = "",
}: {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  status: ChallengeStatus;
  executionAvailable: boolean;
  className?: string;
}) {
  const running = status === "running";

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-fg-subtle">solucion.cpp</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-fg-muted">
            C++17
          </span>
          {!executionAvailable && (
            <span className="rounded-full bg-compete-soft px-2 py-0.5 text-[11px] font-medium text-compete-ink">
              Ejecución no disponible
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="focus-ring inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Reiniciar
        </button>
      </header>

      <div className="min-h-56 flex-1 lg:min-h-0">
        <CodeEditor value={code} onChange={onChange} className="h-full" />
      </div>

      <footer className="border-t border-line bg-surface px-4 py-3 sm:px-5">
        {!executionAvailable && (
          <p className="mb-3 text-xs leading-5 text-compete-ink">
            Este servidor no tiene configurado el servicio de ejecución, así que tu código no se
            compilará y el desafío no puede darse por resuelto.
          </p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-control bg-brand-500 px-5 font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-subtle"
          >
            <Play aria-hidden className="size-4 fill-current" />
            {running ? "Ejecutando…" : "Ejecutar"}
          </button>
        </div>
      </footer>
    </div>
  );
}
