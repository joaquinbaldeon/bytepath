// Comprobaciones sobre el CÓDIGO del registro, sin navegador: qué campos tiene el formulario, qué
// se envía a Supabase y qué columnas define el SQL. Detectan que alguien añada, sin darse cuenta,
// un dato de edad que BytePath ha decidido no recopilar.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const form = read("src/components/auth/RegisterForm.tsx");
const actions = read("src/lib/auth/actions.ts");

const AGE_DATA = /birth|nacimiento|nacim|date_?of_?birth|\bdob\b|\bage\b|\bedad\b|\bdni\b|documento|phone|tel[eé]fono|direcci[oó]n/i;

test("7) el formulario muestra la casilla de 14+ con su texto y su explicación", () => {
  assert.match(form, /Confirmo que tengo 14 años o más\./);
  assert.match(
    form,
    /Actualmente, BytePath permite crear cuentas directamente a personas de 14 años o más\. Si eres\s+menor de 14 años, consulta con tu madre, padre o tutor\./,
  );
  assert.doesNotMatch(form, /ley peruana|edad mínima legal|29733/i);
});

test("8) dos casillas separadas, obligatorias, y el botón exige las dos", () => {
  const checkboxes = form.match(/type="checkbox"/g) ?? [];
  assert.equal(checkboxes.length, 2);
  assert.match(form, /id=\{AGE_CONFIRMATION_FIELD\}\s+name=\{AGE_CONFIRMATION_FIELD\}\s+type="checkbox"\s+required/);
  assert.match(form, /id=\{TERMS_ACCEPTANCE_FIELD\}\s+name=\{TERMS_ACCEPTANCE_FIELD\}\s+type="checkbox"\s+required/);
  assert.match(form, /disabled=\{!confirmedAge \|\| !acceptedTerms\}/);
});

test("5/6) el formulario no pide fecha de nacimiento, edad exacta ni otros datos de edad", () => {
  const names = [...form.matchAll(/name=(?:"([^"]+)"|\{([A-Z_]+)\})/g)].map((m) => m[1] ?? m[2]).sort();
  assert.deepEqual(names, [
    "AGE_CONFIRMATION_FIELD",
    "TERMS_ACCEPTANCE_FIELD",
    "email",
    "password",
    "passwordConfirm",
    "termsVersion",
    "username",
  ]);
  assert.doesNotMatch(form, /type="(date|number|tel)"/);
});

test("4) el servidor comprueba las casillas antes de llamar a Supabase", () => {
  const body = actions.slice(actions.indexOf("export async function signUpAction"), actions.indexOf("export async function signInAction"));
  const check = body.indexOf("checkSignUpConsents(formData)");
  assert.ok(check > 0, "signUpAction debe llamar a checkSignUpConsents");
  assert.ok(check < body.indexOf("createSupabaseServerClient()"), "…antes de crear el cliente de Supabase");
  assert.ok(check < body.indexOf("supabase.auth.signUp("), "…y antes del alta");
});

test("5/6) a Supabase solo se envían username y terms_version: ni edad ni la confirmación", () => {
  // Además de username y terms_version solo viaja la prueba de alta (auth-guard.sql), que la base
  // de datos comprueba y BORRA: no es un dato de edad y no queda guardada.
  assert.match(actions, /data: \{ username, terms_version: TERMS_VERSION, \.\.\.\(signupProof \? \{ signup_proof: signupProof \} : \{\}\) \}/);
  assert.doesNotMatch(actions, /confirmAge|age_confirmed|AGE_CONFIRMATION_FIELD|over_?14|birth/i);
});

test("5/6) el SQL no define columnas de fecha de nacimiento, edad ni documento", () => {
  const dir = new URL("supabase/", root);
  const files = readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".sql"));
  assert.ok(files.length > 0);
  for (const file of files) {
    const sql = readFileSync(new URL(String(file).replaceAll("\\", "/"), dir), "utf8")
      .replace(/--.*$/gm, "") // los comentarios pueden hablar de estos datos
      .replace(/'(?:[^']|'')*'/g, "''"); // y los textos también
    for (const match of sql.matchAll(/(?:create table|add column)[^;]*;/gi)) {
      assert.doesNotMatch(match[0], AGE_DATA, `${file}: ${match[0].slice(0, 80)}…`);
    }
  }
});
