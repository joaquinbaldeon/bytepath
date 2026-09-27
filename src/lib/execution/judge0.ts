import "server-only";

import type { ChallengeLimits, ChallengeTest } from "@/server/challenges/tests";

/**
 * Cliente de Judge0. **Solo servidor.**
 *
 * Es el único módulo que lee la clave de API y el único que sabe que Judge0
 * existe. Si algún día se cambia de servicio de ejecución, se reescribe este
 * archivo y nada más.
 */

const JUDGE0_URL = process.env.JUDGE0_URL?.replace(/\/+$/, "");
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST;
const JUDGE0_LANGUAGE_ID = process.env.JUDGE0_LANGUAGE_ID;

/** Techo de espera total: por encima de esto se devuelve `unavailable`. */
const POLL_BUDGET_MS = 25_000;
const POLL_INTERVAL_MS = 700;
/**
 * `fetch` no trae tiempo máximo propio: sin esto, un servidor que acepta la
 * conexión y nunca responde dejaría la ejecución colgada indefinidamente.
 */
const REQUEST_TIMEOUT_MS = 10_000;

export type Judge0Run = {
  statusId: number;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  timeMs?: number;
  memoryKb?: number;
};

export class Judge0Error extends Error {}

export function isJudge0Configured(): boolean {
  return Boolean(JUDGE0_URL);
}

function authHeaders(): Record<string, string> {
  if (!JUDGE0_API_KEY) return {};
  // RapidAPI usa dos cabeceras propias; una instancia autoalojada usa X-Auth-Token.
  return JUDGE0_API_HOST
    ? { "X-RapidAPI-Key": JUDGE0_API_KEY, "X-RapidAPI-Host": JUDGE0_API_HOST }
    : { "X-Auth-Token": JUDGE0_API_KEY };
}

async function judge0Fetch(path: string, init?: RequestInit): Promise<Response> {
  if (!JUDGE0_URL) throw new Judge0Error("Judge0 no está configurado");

  let response: Response;
  try {
    response = await fetch(`${JUDGE0_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    // Red caída, DNS, TLS o tiempo agotado: para el estudiante es lo mismo,
    // el servicio no está disponible. Nunca es culpa de su código.
    throw new Judge0Error("No se ha podido contactar con Judge0", { cause: (error as Error).cause ?? error });
  }

  if (!response.ok) {
    // Solo el código HTTP. El cuerpo de la respuesta no se copia al mensaje
    // (que acaba en los logs): no se sabe qué puede incluir un proveedor.
    throw new Judge0Error(`Judge0 respondió ${response.status}`);
  }
  return response;
}

/**
 * Lee el JSON de una respuesta de Judge0. Si no es JSON válido, lanza un
 * Judge0Error SIN el cuerpo: el mensaje de un SyntaxError incluye el principio
 * del texto recibido, y ese mensaje acabaría en los logs.
 */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Judge0Error(`Judge0 devolvió una respuesta no válida (HTTP ${response.status})`);
  }
}

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");
const decode = (value: string | null | undefined) =>
  value ? Buffer.from(value, "base64").toString("utf8") : "";

let cachedLanguageId: number | null = null;

/**
 * Los identificadores de lenguaje cambian entre instancias de Judge0, así que
 * se consultan en vez de fijarlos a ciegas. Se prefiere el GCC más reciente.
 */
async function resolveLanguageId(): Promise<number> {
  if (JUDGE0_LANGUAGE_ID) return Number(JUDGE0_LANGUAGE_ID);
  if (cachedLanguageId !== null) return cachedLanguageId;

  const languages = (await (await judge0Fetch("/languages")).json()) as {
    id: number;
    name: string;
  }[];

  const cpp = languages.filter((language) => /^C\+\+/i.test(language.name));
  if (cpp.length === 0) throw new Judge0Error("Esta instancia de Judge0 no ofrece C++");

  const gcc = cpp.filter((language) => /gcc/i.test(language.name));
  const chosen = (gcc.length > 0 ? gcc : cpp).sort((a, b) => b.id - a.id)[0];

  cachedLanguageId = chosen.id;
  return chosen.id;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envía todos los casos en un solo lote y espera a que terminen.
 * Devuelve el resultado bruto por caso, en el mismo orden.
 */
export async function runOnJudge0({
  source,
  tests,
  limits,
}: {
  source: string;
  tests: ChallengeTest[];
  limits: ChallengeLimits;
}): Promise<Judge0Run[]> {
  const languageId = await resolveLanguageId();

  const submissions = tests.map((test) => ({
    language_id: languageId,
    source_code: encode(source),
    stdin: encode(test.stdin ?? ""),
    cpu_time_limit: limits.cpuSeconds,
    wall_time_limit: limits.wallSeconds,
    memory_limit: limits.memoryMb * 1024,
    // Nunca se envía la salida esperada: la comparación la hace BytePath con
    // su propia normalización, para que haya una sola fuente de verdad.
  }));

  const created = await readJson(
    await judge0Fetch("/submissions/batch?base64_encoded=true", {
      method: "POST",
      body: JSON.stringify({ submissions }),
    }),
  );
  if (!Array.isArray(created)) throw new Judge0Error("Judge0 devolvió una respuesta inesperada al crear el envío");

  const tokens = (created as { token?: unknown }[])
    .map((item) => item?.token)
    .filter((token): token is string => typeof token === "string");
  if (tokens.length !== tests.length) {
    throw new Judge0Error("Judge0 no aceptó todos los casos del envío");
  }

  const deadline = Date.now() + POLL_BUDGET_MS;
  const query = `tokens=${tokens.join(",")}&base64_encoded=true&fields=status_id,stdout,stderr,compile_output,message,time,memory`;

  while (Date.now() < deadline) {
    const batch = (await readJson(await judge0Fetch(`/submissions/batch?${query}`))) as {
      submissions: {
        status_id: number;
        stdout: string | null;
        stderr: string | null;
        compile_output: string | null;
        message: string | null;
        time: string | null;
        memory: number | null;
      }[];
    };

    if (!batch || !Array.isArray(batch.submissions) || batch.submissions.length !== tokens.length) {
      throw new Judge0Error("Judge0 devolvió una respuesta inesperada al consultar el envío");
    }

    // 1 = en cola, 2 = procesando. Cualquier otro valor es un estado final.
    const done = batch.submissions.every((item) => item.status_id > 2);
    if (done) {
      return batch.submissions.map((item) => ({
        statusId: item.status_id,
        stdout: decode(item.stdout),
        stderr: decode(item.stderr),
        compileOutput: decode(item.compile_output),
        message: decode(item.message),
        timeMs: item.time ? Math.round(Number(item.time) * 1000) : undefined,
        memoryKb: item.memory ?? undefined,
      }));
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Judge0Error("Judge0 tardó demasiado en devolver el resultado");
}
