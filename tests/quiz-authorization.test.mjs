// Guardas sobre el CÓDIGO de la corrección de quizzes (auditoría P-M3) y del catálogo de cursos
// (P-B1). No sustituyen a probar la Server Action contra un servidor: detectan que alguien, sin
// darse cuenta, vuelva a leer la respuesta antes de autorizar o meta el catálogo en el navegador.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SRC = path.join(ROOT, "src");
const read = (file) => readFileSync(file, "utf8");
const rel = (file) => path.relative(ROOT, file).replaceAll("\\", "/");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sourceFiles = walk(SRC).filter((file) => /\.(ts|tsx)$/.test(file));

/* ------------------------------ P-M3: orden ------------------------------ */

const actions = read(path.join(SRC, "lib/courses/actions.ts"));
const checkQuiz = actions.slice(
  actions.indexOf("export async function checkQuizAnswerAction"),
  actions.indexOf("export async function saveQuizProgressAction"),
);

test("P-M3: checkQuizAnswerAction autoriza antes de leer la respuesta correcta", () => {
  assert.ok(checkQuiz.length > 0, "no se encuentra checkQuizAnswerAction");
  const at = (needle) => {
    const index = checkQuiz.indexOf(needle);
    assert.ok(index >= 0, `falta «${needle}» en checkQuizAnswerAction`);
    return index;
  };

  const session = at("await resolveWriter()");
  const rejectAnonymous = at('writer.status === "not_signed_in"');
  const rateLimit = at("overLimit(writer, QUIZ_ANSWER_LIMIT)");
  const lookup = at("locate(courseSlug, lessonSlug)");
  const unlock = at("ensureStarted(writer, located.course, located.lesson.slug)");
  const question = at("quiz.questions.find(");
  const answer = at("question.correctOptionId");
  const explanation = at("question.explanation");

  assert.ok(session < lookup, "la sesión se comprueba antes de buscar el contenido");
  assert.ok(rejectAnonymous < lookup, "sin sesión se rechaza antes de buscar el contenido");
  assert.ok(rejectAnonymous < rateLimit && rateLimit < lookup, "el cupo por cuenta se consume tras la sesión y antes de mirar el contenido");
  assert.ok(lookup < unlock, "primero se localiza la lección, luego se comprueba el desbloqueo");
  assert.ok(unlock < question, "la pregunta no se busca hasta que la lección está desbloqueada");
  assert.ok(unlock < answer && unlock < explanation, "la respuesta y la explicación, solo tras el desbloqueo");
  assert.ok(question < answer, "la opción se compara con la pregunta de ESTE quiz");
});

test("P-M3: sin sesión no hay corrección (solo el modo sin Supabase corrige sin anotar)", () => {
  // La única salida `graded` sin anotar es la de `local`, después de todas las comprobaciones.
  const graded = [...checkQuiz.matchAll(/status: "graded"/g)].map((m) => m.index);
  assert.equal(graded.length, 2, "dos salidas con veredicto: local (sin anotar) y la anotada");
  assert.ok(graded[0] > checkQuiz.indexOf("ensureStarted("), "ningún veredicto antes del desbloqueo");
  assert.doesNotMatch(checkQuiz, /"not_signed_in"\)\s*\{\s*return \{ status: "graded"/);
});

test("P-M3: solo la Server Action lee correctOptionId; ningún tipo público lo incluye", () => {
  const readers = sourceFiles
    .filter((file) => !rel(file).startsWith("src/content/"))
    .filter((file) => /\.correctOptionId\b/.test(read(file)))
    .map(rel);
  assert.deepEqual(readers, ["src/lib/courses/actions.ts"]);

  const types = read(path.join(SRC, "lib/courses/types.ts"));
  assert.match(types, /PublicQuizQuestion = Omit<QuizQuestion, "correctOptionId" \| "explanation">/);
});

/* ---------------------------- P-B1: server-only --------------------------- */

test("P-B1: src/lib/courses/api.ts empieza con import \"server-only\"", () => {
  const firstStatement = read(path.join(SRC, "lib/courses/api.ts"))
    .replace(/^﻿/, "") // el archivo lleva BOM
    .split(/\r?\n/)
    .find((line) => line.trim() !== "");
  assert.equal(firstStatement, 'import "server-only";');
});

/**
 * Grafo de imports alcanzable desde los Client Components. Se ignoran los `import type`
 * (desaparecen al compilar) y NO se cruza un archivo "use server": en el navegador, Next.js lo
 * sustituye por llamadas al servidor y no incluye sus dependencias.
 */
function clientReachable() {
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) base = path.join(path.dirname(from), spec);
    else return null;
    for (const cand of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
      if (existsSync(cand) && statSync(cand).isFile()) return cand;
    }
    return null;
  };
  const imports = (file) => {
    const out = [];
    const re =
      /(?:^|\n)\s*(?:import|export)\s+(type\s+)?([^;]*?)\s*from\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
    for (const m of read(file).matchAll(re)) {
      if (m[4] || m[5]) { out.push(m[4] ?? m[5]); continue; }
      if (m[1]) continue;
      const braces = m[2].trim().match(/^\{([\s\S]*)\}$/);
      if (braces && braces[1].split(",").map((s) => s.trim()).filter(Boolean).every((s) => s.startsWith("type "))) continue;
      out.push(m[3]);
    }
    return out.map((spec) => resolve(file, spec)).filter(Boolean);
  };
  const directive = (file, name) => new RegExp(`^\\s*["']use ${name}["']`).test(read(file));

  const entries = sourceFiles.filter((file) => directive(file, "client"));
  const seen = new Set(entries);
  const queue = [...entries];
  while (queue.length) {
    const file = queue.shift();
    if (!entries.includes(file) && directive(file, "server")) continue;
    for (const dep of imports(file)) if (!seen.has(dep)) { seen.add(dep); queue.push(dep); }
  }
  return new Set([...seen].map(rel));
}

test("P-B1: ningún Client Component alcanza el catálogo ni los módulos con respuestas", () => {
  const reachable = clientReachable();
  assert.ok(reachable.size > 40, "el análisis debe encontrar los componentes cliente");
  for (const sensitive of [
    "src/lib/courses/api.ts",
    "src/content/courses/index.ts",
    "src/server/challenges/tests.ts",
    "src/lib/courses/server.ts",
    "src/lib/courses/writer.ts",
  ]) {
    assert.ok(!reachable.has(sensitive), `${sensitive} es alcanzable desde el cliente`);
  }
  assert.equal([...reachable].filter((file) => file.startsWith("src/content/courses/")).length, 0);
});

/* ---------------- Build: lo que de verdad recibe el navegador ---------------- */

const STATIC = path.join(ROOT, ".next/static");
const hasBuild = existsSync(STATIC);

test(
  "build: .next/static no contiene respuestas, explicaciones, soluciones ni salidas ocultas",
  { skip: hasBuild ? false : "sin .next/static: ejecuta `npm run build` antes" },
  () => {
    const chunks = walk(STATIC).filter((file) => /\.(js|css|json|txt|html)$/.test(file)).map(read).join("\n");

    // Trozos literales de cada explicación de quiz y de cada solución / salida de los tests.
    const samples = [];
    const pick = (text) => {
      const plain = text.replace(/\\./g, " ");
      const piece = plain.slice(Math.floor(plain.length / 3), Math.floor(plain.length / 3) + 28);
      if (piece.trim().length >= 20 && !piece.includes("  ")) samples.push(piece);
    };
    for (const file of walk(path.join(SRC, "content/courses")).filter((f) => f.endsWith(".ts"))) {
      for (const m of read(file).matchAll(/explanation:\s*"((?:[^"\\]|\\.){40,})"/g)) pick(m[1]);
    }
    const tests = read(path.join(SRC, "server/challenges/tests.ts"));
    for (const m of tests.matchAll(/(?:solution|expectedOutput):\s*\n?\s*['"]((?:[^'"\\]|\\.){40,})['"]/g)) pick(m[1]);

    assert.ok(samples.length > 50, `muestras insuficientes (${samples.length})`);
    assert.doesNotMatch(chunks, /correctOptionId/);
    const leaked = samples.filter((sample) => chunks.includes(sample));
    assert.deepEqual(leaked, [], "texto de respuestas/soluciones presente en el JavaScript del navegador");
  },
);
