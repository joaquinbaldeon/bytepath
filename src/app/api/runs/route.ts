import { compareOutputs } from "@/lib/courses/outputDiff";
import { isJudge0Configured, Judge0Error, runOnJudge0 } from "@/lib/execution/judge0";
import type {
  RunStatus,
  SubmissionResult,
  TestOutcome,
  TestStatus,
} from "@/lib/execution/types";
import { getTestSuite } from "@/server/challenges/tests";

/** Suficiente para cualquier solución de curso; una típica ocupa 2 KB. */
const MAX_SOURCE_BYTES = 64 * 1024;
const MAX_BODY_BYTES = 128 * 1024;
const MAX_OUTPUT_CHARS = 8 * 1024;

export const maxDuration = 30;

function truncate(value: string): string {
  return value.length > MAX_OUTPUT_CHARS
    ? `${value.slice(0, MAX_OUTPUT_CHARS)}\n… (salida recortada)`
    : value;
}

/** Traduce el estado de Judge0 al vocabulario de BytePath. */
function toTestStatus(statusId: number, memoryKb: number | undefined, limitMb: number): TestStatus {
  switch (statusId) {
    case 3:
      return "ok"; // ejecutó bien; si la salida coincide lo decide la comparación
    case 5:
      return "timeout";
    case 8:
      return "output_limit"; // SIGXFSZ: escribió más de lo permitido
    case 13:
    case 14:
      return "internal_error";
    default: {
      if (statusId >= 7 && statusId <= 12) {
        // Judge0 informa la falta de memoria como señal, así que se deduce
        // comparando con el límite. Es una heurística, no un dato exacto.
        const limitKb = limitMb * 1024;
        if (memoryKb !== undefined && memoryKb >= limitKb * 0.95) return "memory_limit";
        return "runtime_error";
      }
      return "internal_error";
    }
  }
}

function verdictFrom(outcomes: TestOutcome[]): RunStatus {
  const failed = outcomes.find((outcome) => outcome.status !== "ok");
  if (!failed) return "passed";

  switch (failed.status) {
    case "wrong_output":
      return "failed";
    case "timeout":
      return "timeout";
    case "memory_limit":
      return "memory_limit";
    case "output_limit":
      return "output_limit";
    case "runtime_error":
      return "runtime_error";
    default:
      return "internal_error";
  }
}

function json(result: SubmissionResult, status = 200) {
  return Response.json(result, { status });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ status: "internal_error", message: "La petición es demasiado grande.", tests: [] }, 413);
  }

  let body: { challengeId?: unknown; language?: unknown; source?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ status: "internal_error", message: "Petición mal formada.", tests: [] }, 400);
  }

  const { challengeId, language, source } = body;

  if (typeof challengeId !== "string" || typeof source !== "string") {
    return json({ status: "internal_error", message: "Faltan datos del envío.", tests: [] }, 400);
  }
  if (language !== "cpp") {
    return json({ status: "internal_error", message: "Lenguaje no admitido.", tests: [] }, 400);
  }
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
    return json({ status: "internal_error", message: "Tu código supera los 64 KB.", tests: [] }, 413);
  }

  // Los casos los resuelve el servidor a partir del identificador: el navegador
  // nunca los envía ni los conoce.
  const suite = getTestSuite(challengeId);
  if (!suite) {
    return json({ status: "internal_error", message: "Desafío desconocido.", tests: [] }, 404);
  }

  if (!isJudge0Configured()) {
    return json(
      {
        status: "unavailable",
        message:
          "La ejecución real no está configurada en este servidor, así que tu código no se ha compilado.",
        tests: [],
      },
      200,
    );
  }

  let runs;
  try {
    runs = await runOnJudge0({ source, tests: suite.tests, limits: suite.limits });
  } catch (error) {
    const unavailable = error instanceof Judge0Error;
    console.error("[runs] fallo al ejecutar en Judge0:", error);
    return json(
      {
        status: unavailable ? "unavailable" : "internal_error",
        message: unavailable
          ? "El servicio de ejecución no está disponible ahora mismo."
          : "No se ha podido ejecutar tu código.",
        tests: [],
      },
      200,
    );
  }

  // Un error de compilación afecta a todo el envío, no a un caso concreto.
  const compileFailure = runs.find((run) => run.statusId === 6);
  if (compileFailure) {
    return json({
      status: "compile_error",
      compileOutput: truncate(compileFailure.compileOutput || compileFailure.stderr),
      tests: [],
    });
  }

  const outcomes: TestOutcome[] = runs.map((run, i) => {
    const test = suite.tests[i];
    const executionStatus = toTestStatus(run.statusId, run.memoryKb, suite.limits.memoryMb);

    const status: TestStatus =
      executionStatus === "ok"
        ? compareOutputs(run.stdout, test.expectedOutput).matches
          ? "ok"
          : "wrong_output"
        : executionStatus;

    const outcome: TestOutcome = {
      index: i + 1,
      status,
      timeMs: run.timeMs,
      memoryKb: run.memoryKb,
    };

    // De un caso oculto solo se devuelve si pasó: ni su entrada ni su salida.
    if (!test.hidden) {
      outcome.stdout = truncate(run.stdout);
      outcome.expectedOutput = test.expectedOutput;
      if (run.stderr) outcome.stderr = truncate(run.stderr);
    }

    return outcome;
  });

  return json({ status: verdictFrom(outcomes), tests: outcomes });
}
