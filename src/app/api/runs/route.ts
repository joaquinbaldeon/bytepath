import { getCurrentUser } from "@/lib/auth/session";
import { isLessonUnlocked } from "@/lib/courses/access";
import { findChallenge } from "@/lib/courses/api";
import { completedSlugs } from "@/lib/courses/progress";
import { readCourseProgress } from "@/lib/courses/server";
import type { Course, Lesson } from "@/lib/courses/types";
import { compareOutputs } from "@/lib/courses/outputDiff";
import { callWriter, ensureStarted, resolveWriter } from "@/lib/courses/writer";
import { isJudge0Configured, Judge0Error, runOnJudge0 } from "@/lib/execution/judge0";
import type {
  RunStatus,
  SubmissionResult,
  TestOutcome,
  TestStatus,
} from "@/lib/execution/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeSupabaseError, logSupabaseFailure } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

function json(result: SubmissionResult, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(result, {
    status,
    // La respuesta es de un usuario concreto: ninguna caché intermedia debe guardarla.
    headers: { "Cache-Control": "no-store, private", ...extraHeaders },
  });
}

/**
 * ¿Quién está ejecutando? Ejecutar código cuesta cuota del servicio de
 * ejecución, así que exige una cuenta: sin esto, BytePath sería una pasarela
 * gratuita y sin cuenta hacia Judge0.
 *
 * Única excepción: sin Supabase configurado no existen cuentas; en ese caso
 * solo se permite en desarrollo (`next dev`), para poder escribir contenido
 * sin montar la base de datos. En producción sin Supabase, no se ejecuta nada.
 */
async function authorize(): Promise<{ userId: string | null } | Response> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "development") return { userId: null };
    return json({ status: "unavailable", message: "La ejecución no está disponible.", tests: [] }, 503);
  }

  const user = await getCurrentUser();
  if (!user) {
    return json(
      { status: "unavailable", message: "Inicia sesión para ejecutar tu código.", tests: [] },
      401,
    );
  }
  return { userId: user.id };
}

/**
 * ¿Puede este usuario ejecutar el desafío de esta lección? Lo decide el
 * servidor con el progreso GUARDADO (lectura con la sesión del usuario, RLS):
 * la lección tiene que estar desbloqueada. Nada de lo que diga el navegador
 * cuenta como prueba.
 *
 * Sin Supabase configurado no hay progreso que consultar (solo en desarrollo:
 * `authorize` ya rechaza producción sin Supabase).
 */
async function checkLessonAccess(course: Course, lesson: Lesson): Promise<Response | null> {
  if (!isSupabaseConfigured()) return null;

  const { enforce, unavailable, progress } = await readCourseProgress(course.slug);
  if (unavailable) {
    return json(
      { status: "unavailable", message: "No se ha podido comprobar tu progreso. Inténtalo en un momento.", tests: [] },
      503,
    );
  }
  if (enforce && !isLessonUnlocked(course, lesson.slug, completedSlugs(progress))) {
    return json(
      { status: "unavailable", message: "Completa antes la lección anterior para ejecutar este desafío.", tests: [] },
      403,
    );
  }
  return null;
}

/**
 * Cupo de ejecuciones del usuario (12/min y 300/día, fijados en
 * `consume_run_quota`, supabase/security.sql). Se consume con la SESIÓN del
 * usuario: no hace falta la clave de servicio, y el sujeto es `auth.uid()`,
 * así que nadie puede gastar el cupo de otro. Si no se puede comprobar, NO se
 * ejecuta: abrir la puerta cuando falla el límite es lo que se quiere evitar.
 */
async function consumeRunQuota(): Promise<Response | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_run_quota");

  if (error || !data) {
    logSupabaseFailure("runs", "consume_run_quota", describeSupabaseError(error));
    return json(
      { status: "unavailable", message: "La ejecución no está disponible ahora mismo. Inténtalo en un momento.", tests: [] },
      503,
    );
  }

  const quota = data as { allowed: boolean; retry_after?: number; reason?: string };
  if (quota.reason === "not_signed_in") {
    return json({ status: "unavailable", message: "Inicia sesión para ejecutar tu código.", tests: [] }, 401);
  }
  if (!quota.allowed) {
    const wait = Math.max(1, quota.retry_after ?? 60);
    const label = wait < 90 ? `${wait} s` : `${Math.ceil(wait / 60)} min`;
    return json(
      {
        status: "unavailable",
        message: `Has hecho muchas ejecuciones seguidas. Espera ${label} y vuelve a intentarlo.`,
        tests: [],
      },
      429,
      { "Retry-After": String(wait) },
    );
  }
  return null;
}

/**
 * Deja constancia de que el desafío está resuelto.
 *
 * Solo lo llama el servidor, y solo con un veredicto "passed" que ÉL mismo ha
 * obtenido de Judge0: es lo único que hace constar un desafío como superado, y
 * lo que más tarde exige `complete_lesson`. Devuelve `undefined` cuando no
 * hay nada que anotar (sin cuentas, o sin sesión), y `false` cuando había que
 * anotarlo y no se ha podido. Curso y lección son los que el SERVIDOR ha
 * deducido del desafío, no los del navegador.
 */
async function recordChallengePass(course: Course, lesson: Lesson): Promise<boolean | undefined> {
  const writer = await resolveWriter();
  if (writer.status === "local" || writer.status === "not_signed_in") return undefined;
  if (writer.status !== "ready") return false;

  if ((await ensureStarted(writer, course, lesson.slug)) !== "ok") return false;

  const result = await callWriter<{ recorded: boolean }>(writer, "record_challenge_pass", {
    p_course: course.slug,
    p_lesson: lesson.slug,
  });
  return result?.recorded === true;
}

export async function POST(request: Request) {
  // 1. Sesión. Antes de leer siquiera el cuerpo: sin sesión no se procesa nada.
  const auth = await authorize();
  if (auth instanceof Response) return auth;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ status: "internal_error", message: "La petición es demasiado grande.", tests: [] }, 413);
  }

  let body: {
    challengeId?: unknown;
    language?: unknown;
    source?: unknown;
    courseSlug?: unknown;
    lessonSlug?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ status: "internal_error", message: "Petición mal formada.", tests: [] }, 400);
  }

  const { challengeId, language, source, courseSlug, lessonSlug } = body;

  if (typeof challengeId !== "string" || typeof source !== "string") {
    return json({ status: "internal_error", message: "Faltan datos del envío.", tests: [] }, 400);
  }
  if (language !== "cpp") {
    return json({ status: "internal_error", message: "Lenguaje no admitido.", tests: [] }, 400);
  }
  if (Buffer.byteLength(source, "utf8") > MAX_SOURCE_BYTES) {
    return json({ status: "internal_error", message: "Tu código supera los 64 KB.", tests: [] }, 413);
  }

  // 2. El desafío existe y el servidor sabe de qué lección es (por el
  // contenido, no por lo que diga el navegador). Los casos los resuelve el
  // servidor a partir del identificador: el navegador nunca los envía ni los conoce.
  const located = findChallenge(challengeId);
  const suite = located ? getTestSuite(challengeId) : undefined;
  if (!located || !suite) {
    return json({ status: "internal_error", message: "Desafío desconocido.", tests: [] }, 404);
  }

  // El curso y la lección que envía el navegador tienen que coincidir con los
  // del desafío. No conceden nada; si no cuadran, la petición está manipulada y
  // se rechaza sin ejecutar.
  if (courseSlug !== located.course.slug || lessonSlug !== located.lesson.slug) {
    return json({ status: "internal_error", message: "El desafío no corresponde a esta lección.", tests: [] }, 400);
  }

  // 3. La lección está desbloqueada para ESTE usuario (progreso guardado).
  const denied = await checkLessonAccess(located.course, located.lesson);
  if (denied) return denied;

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

  // 4. Cupo del usuario: solo se gasta cuando la petición ya es válida y la
  // lección está abierta.
  if (auth.userId) {
    const quotaDenied = await consumeRunQuota();
    if (quotaDenied) return quotaDenied;
  }

  // 5. Judge0. Solo recibe el código, las entradas de prueba, el lenguaje y los
  // límites: ni usuario, ni correo, ni curso, ni lección (ver judge0.ts).
  let runs;
  try {
    runs = await runOnJudge0({ source, tests: suite.tests, limits: suite.limits });
  } catch (error) {
    const unavailable = error instanceof Judge0Error;
    // Solo lo útil para depurar: el tipo de fallo, el mensaje de un Judge0Error
    // (los escribe judge0.ts y nunca llevan el cuerpo de la respuesta, el
    // código, stdin ni tokens) y el código técnico de la causa (DNS, TLS,
    // conexión rechazada). De cualquier otro error, solo su nombre: su mensaje
    // podría contener parte de la respuesta.
    const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
    console.error("[runs] fallo al ejecutar en Judge0", {
      kind: unavailable ? "unavailable" : "internal_error",
      detail: unavailable ? (error as Judge0Error).message.slice(0, 160) : error instanceof Error ? error.name : "desconocido",
      cause: typeof cause?.code === "string" ? cause.code : null,
    });
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

  const status = verdictFrom(outcomes);
  const recorded =
    status === "passed" ? await recordChallengePass(located.course, located.lesson) : undefined;

  return json({ status, tests: outcomes, ...(recorded === undefined ? {} : { recorded }) });
}
