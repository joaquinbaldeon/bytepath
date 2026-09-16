import type { ReactNode } from "react";
import { compareOutputs } from "@/lib/courses/outputDiff";
import type { ChallengeStatus } from "@/lib/courses/useLessonChallenge";
import type { SubmissionResult, TestOutcome } from "@/lib/execution/types";

/**
 * Armazón de los dos paneles inferiores.
 *
 * El panel derecho es un hueco a propósito: hoy recibe la salida esperada, y
 * cuando lleguen los casos ocultos bastará con pasarle un panel de tests sin
 * tocar ni este armazón ni el panel de la izquierda.
 */
export function OutputPanels({
  leftTitle = "Salida",
  left,
  rightTitle,
  right,
  note,
}: {
  leftTitle?: string;
  left: ReactNode;
  rightTitle: string;
  right: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-2">
        <section aria-label={leftTitle} className="flex min-h-0 flex-col border-line max-sm:border-b sm:border-r">
          <h3 className="border-b border-line bg-surface-2 px-4 py-2 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
            {leftTitle}
          </h3>
          <div className="min-h-0 flex-1 overflow-auto">{left}</div>
        </section>

        <section aria-label={rightTitle} className="flex min-h-0 flex-col">
          <h3 className="border-b border-line bg-surface-2 px-4 py-2 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
            {rightTitle}
          </h3>
          <div className="min-h-0 flex-1 overflow-auto">{right}</div>
        </section>
      </div>
      {note}
    </div>
  );
}

function Lines({ lines, mismatches }: { lines: (string | null)[]; mismatches: boolean[] }) {
  return (
    <pre className="min-h-full px-0 py-2 font-mono text-[13px] leading-6">
      {lines.map((line, i) => (
        <div key={i} className={`flex px-4 ${mismatches[i] ? "bg-danger-soft" : ""}`}>
          <span className="w-6 shrink-0 pr-3 text-right text-fg-subtle/60 select-none">
            {line === null ? "" : i + 1}
          </span>
          <span
            className={`whitespace-pre ${line === null ? "text-fg-subtle/60 italic" : "text-fg-body"}`}
          >
            {line === null ? "(sin línea)" : line === "" ? " " : line}
          </span>
        </div>
      ))}
    </pre>
  );
}

function Message({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "bad" }) {
  return (
    <p className={`px-4 py-6 text-sm leading-6 ${tone === "bad" ? "text-danger-ink" : "text-fg-muted"}`}>
      {children}
    </p>
  );
}

function Raw({ text }: { text: string }) {
  return (
    <pre className="min-h-full px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre-wrap text-fg-body">
      {text}
    </pre>
  );
}

const noteTone = {
  bad: "text-danger-ink",
  warn: "text-compete-ink",
} as const;

function Note({ tone, children }: { tone: keyof typeof noteTone; children: ReactNode }) {
  return (
    <p className={`border-t border-line px-4 py-2.5 text-xs leading-5 ${noteTone[tone]}`}>
      {children}
    </p>
  );
}

export function OutputComparison({
  status,
  result,
  outcome,
  expectedOutput,
  rightTitle = "Salida esperada",
}: {
  status: ChallengeStatus;
  result: SubmissionResult | null;
  outcome: TestOutcome | null;
  /** Se usa antes de ejecutar, cuando todavía no hay resultado del servidor. */
  expectedOutput?: string;
  rightTitle?: string;
}) {
  const expected = outcome?.expectedOutput ?? expectedOutput ?? "";
  const comparison =
    outcome?.stdout !== undefined && outcome.expectedOutput !== undefined
      ? compareOutputs(outcome.stdout, outcome.expectedOutput)
      : null;

  const expectedLines = expected.replace(/\r\n?/g, "\n").split("\n");

  /* ---------- panel izquierdo ---------- */
  let left: ReactNode;
  if (status === "idle") {
    left = <Message>Ejecuta tu programa para ver aquí su salida.</Message>;
  } else if (status === "running") {
    left = <Message>Compilando y ejecutando…</Message>;
  } else if (status === "compile_error") {
    left = result?.compileOutput ? (
      <Raw text={result.compileOutput} />
    ) : (
      <Message tone="bad">Tu código no ha compilado.</Message>
    );
  } else if (status === "unavailable" || status === "internal_error") {
    left = <Message tone={status === "unavailable" ? "muted" : "bad"}>{result?.message}</Message>;
  } else if (comparison) {
    left = (
      <Lines
        lines={comparison.rows.map((row) => row.actual)}
        mismatches={comparison.rows.map((row) => !row.match)}
      />
    );
  } else if (outcome?.stdout) {
    left = <Raw text={outcome.stdout} />;
  } else {
    left = <Message>Tu programa no llegó a escribir nada.</Message>;
  }

  /* ---------- panel derecho ---------- */
  const right = comparison ? (
    <Lines
      lines={comparison.rows.map((row) => row.expected)}
      mismatches={comparison.rows.map((row) => !row.match)}
    />
  ) : (
    <Lines lines={expectedLines} mismatches={expectedLines.map(() => false)} />
  );

  /* ---------- nota ---------- */
  let note: ReactNode;
  switch (status) {
    case "unavailable":
      note = <Note tone="warn">La ejecución real no está disponible, así que el desafío no puede darse por aprobado.</Note>;
      break;
    case "compile_error":
      note = <Note tone="bad">Tu código no compila. Corrige los errores del compilador y vuelve a ejecutar.</Note>;
      break;
    case "runtime_error":
      note = <Note tone="bad">Tu programa se detuvo de forma anómala durante la ejecución.</Note>;
      break;
    case "timeout":
      note = <Note tone="warn">Tu programa tardó demasiado. Revisa si hay un bucle que no termina.</Note>;
      break;
    case "memory_limit":
      note = <Note tone="warn">Tu programa superó la memoria permitida.</Note>;
      break;
    case "output_limit":
      note = <Note tone="warn">Tu programa escribió muchísimo más de lo esperado.</Note>;
      break;
    case "internal_error":
      note = <Note tone="bad">{result?.message ?? "No se ha podido ejecutar tu código."}</Note>;
      break;
    case "failed":
      note = comparison?.whitespaceOnly ? (
        <Note tone="warn">
          La diferencia está solo en los espacios. Revisa dónde pones los espacios y los saltos de
          línea.
        </Note>
      ) : (
        <Note tone="bad">La salida todavía no coincide. Las líneas resaltadas son las que difieren.</Note>
      );
      break;
    default:
      note = undefined;
  }

  return <OutputPanels left={left} rightTitle={rightTitle} right={right} note={note} />;
}
