// Guardas de lo que se preparó para el despliegue público: altas y credenciales solo a través
// del servidor (auth-guard.sql + migraciones), límites por cuenta, exportación sin secretos,
// origen público sin cabeceras en producción y variables de entorno sin secretos.
// Las reglas de la base de datos se prueban de verdad en supabase/security-tests.sql.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8").replace(/^﻿/, "");
const between = (text, from, to) => text.slice(text.indexOf(from), to ? text.indexOf(to, text.indexOf(from)) : undefined);

test("P-M1: el alta pide la prueba DESPUÉS de validar y la envía a Supabase", () => {
  const actions = read("src/lib/auth/actions.ts");
  const signUp = between(actions, "export async function signUpAction", "export async function signInAction");
  const consents = signUp.indexOf("checkSignUpConsents(formData)");
  const proof = signUp.indexOf("await issueSignupProof(email)");
  const call = signUp.indexOf("supabase.auth.signUp(");
  assert.ok(consents > 0 && proof > consents && call > proof, "consentimientos → prueba → alta");
  assert.match(actions, /admin\.rpc\("issue_signup_proof", \{ p_email: email \}\)/);
});

test("P-M1/P-M2: auth-guard.sql va en setup.sql, con exigencia desactivada por defecto", () => {
  const bundler = read("scripts/build-setup-sql.mjs");
  assert.match(bundler, /"auth-guard\.sql"\]/);
  const setup = read("supabase/setup.sql");
  for (const needle of [
    "create trigger guard_auth_user_insert",
    "before insert on auth.users",
    "create trigger guard_auth_user_update",
    "enforce boolean not null default false",
    "- 'signup_proof'",
    "grant execute on function public.issue_signup_proof(text) to service_role",
    "grant execute on function public.issue_password_change_ticket(uuid) to service_role",
  ]) {
    assert.ok(setup.includes(needle), `setup.sql debe contener «${needle}»`);
  }
  // Ni el secreto ni una marca de edad se guardan: el secreto lo genera la BD.
  assert.match(setup, /extensions\.gen_random_bytes\(32\)/);
  assert.doesNotMatch(setup, /is_over_14|over14|birth_date|date_of_birth/i);
});

test("migraciones: 0003 publica los Términos 1.1 y 0004 activa la exigencia (sin ejecutarse solas)", () => {
  assert.ok(existsSync(new URL("../supabase/migrations/0003_publish_terms_1_1.sql", import.meta.url)));
  assert.ok(existsSync(new URL("../supabase/migrations/0004_enforce_server_side_auth.sql", import.meta.url)));
  const m3 = read("supabase/migrations/0003_publish_terms_1_1.sql");
  assert.match(m3, /values \('terms', '1\.1', date '2026-09-27'\)\s+on conflict \(document_type, version\) do nothing/);
  assert.doesNotMatch(m3, /delete|update public\.legal_acceptances|drop /i);
  const m4 = read("supabase/migrations/0004_enforce_server_side_auth.sql");
  assert.match(m4, /update public\.auth_guard_config\s+set enforce = true/);
  const documents = read("src/lib/legal/documents.ts");
  assert.match(documents, /TERMS_VERSION = "1\.1"/);
});

test("P-M2: el cambio de contraseña emite el permiso DESPUÉS de comprobar y ANTES de cambiarla", () => {
  const account = read("src/lib/account/actions.ts");
  const update = between(account, "export async function updatePasswordAction", "async function issuePasswordChangeTicket");
  const reauth = update.indexOf("checkCurrentPassword(user.id, user.email, current)");
  const ticket = update.indexOf("await issuePasswordChangeTicket(user.id)");
  const change = update.indexOf("supabase.auth.updateUser({ password })");
  const others = update.indexOf('signOut({ scope: "others" })');
  assert.ok(reauth > 0 && ticket > reauth && change > ticket && others > change);
  // El permiso es para el usuario de la SESIÓN, nunca de un campo del formulario.
  assert.doesNotMatch(update, /formData\.get\("(userId|user_id|id)"\)/);
});

test("P-M3/P-B3: todas las acciones de progreso consumen el cupo de la cuenta", () => {
  const actions = read("src/lib/courses/actions.ts");
  for (const [name, next, rule] of [
    ["startLessonAction", "checkQuizAnswerAction", "PROGRESS_ACTION_LIMIT"],
    ["checkQuizAnswerAction", "saveQuizProgressAction", "QUIZ_ANSWER_LIMIT"],
    ["saveQuizProgressAction", "resetQuizProgressAction", "PROGRESS_ACTION_LIMIT"],
    ["resetQuizProgressAction", "type RawComplete", "PROGRESS_ACTION_LIMIT"],
    ["completeLessonAction", null, "PROGRESS_ACTION_LIMIT"],
  ]) {
    const body = between(actions, `export async function ${name}`, next ?? undefined);
    assert.match(body, new RegExp(`overLimit\\(writer, ${rule}\\)`), name);
  }
  const limiter = read("src/lib/security/rateLimit.ts");
  assert.match(limiter, /QUIZ_ANSWER_LIMIT: LimitRule = \{ bucket: "quiz-answer", limit: 30, windowSeconds: 60 \}/);
  assert.match(limiter, /consume\(rule, userId, userId\)/);
});

test("P-B4: la exportación es completa y no incluye secretos ni datos de otros", () => {
  const route = read("src/app/api/cuenta/exportar/route.ts");
  for (const column of ["quiz_state", "activated_on", "provider_customer_id", "last_sign_in_at", "user_metadata"]) {
    assert.ok(route.includes(column), `falta ${column}`);
  }
  assert.doesNotMatch(route, /encrypted_password|refresh_token|access_token|getSession|cookies\(\)/);
  // Los contadores se filtran por el id de la SESIÓN.
  assert.match(route, /\.from\("rate_limits"\)[\s\S]{0,120}\.eq\("user_id", user\.id\)/);
  assert.doesNotMatch(route, /searchParams|request\.url/);
});

test("P-B5: el username no se puede cambiar desde el navegador", () => {
  for (const file of ["supabase/schema.sql", "supabase/security.sql", "supabase/setup.sql"]) {
    const sql = read(file);
    assert.doesNotMatch(sql, /grant update \(username\)/, file);
    assert.doesNotMatch(sql, /create policy "perfil propio: actualización"/, file);
  }
});

test("P-B1: catálogo y API de cursos con server-only", () => {
  assert.match(read("src/lib/courses/api.ts"), /^import "server-only";/);
  assert.match(read("src/content/courses/index.ts"), /^\/\/.*\nimport "server-only";/);
});

test("producción: el origen de los correos no sale de cabeceras de la petición", () => {
  const actions = read("src/lib/auth/actions.ts");
  const origin = between(actions, "async function publicOriginForEmails", "async function issueSignupProof");
  const production = origin.indexOf('process.env.NODE_ENV === "production") return null');
  const header = origin.indexOf('(await headers()).get("origin")');
  assert.ok(production > 0 && header > production, "en producción se devuelve null antes de mirar la cabecera Origin");
});

test(".env.example: sin secretos y solo URL y clave publicable como públicas", () => {
  const env = read(".env.example");
  const publicVars = [...env.matchAll(/^#?\s*(NEXT_PUBLIC_[A-Z_]+)=/gm)].map((m) => m[1]);
  assert.deepEqual([...new Set(publicVars)].sort(), [
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
  ]);
  assert.doesNotMatch(env, /eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9]|sb_publishable_[A-Za-z0-9]{10,}/);
  assert.match(env, /^# HMAC_SECRET=$/m);
  assert.match(env, /TRUSTED_IP_HEADER=x-real-ip/);
});
