// Datos de contacto, Términos y Política de Privacidad: sin marcadores pendientes, sin datos
// inventados, sin promesas que el código no cumple y coherentes entre sí. Lo que ve el usuario
// en las páginas servidas se comprueba en rendered-legal.test.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LEGAL_DRAFT, LEGAL_OWNER, legalDocuments, TERMS_VERSION } from "../src/lib/legal/documents.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
/** El texto tal como se lee: sin saltos de línea del código ni los {" "} de JSX. */
const prose = (source) => source.replace(/\{" "\}/g, " ").replace(/\s+/g, " ");

const termsSource = read("src/content/legal/terms.tsx");
const privacySource = read("src/content/legal/privacy.tsx");
const terms = prose(termsSource);
const privacy = prose(privacySource);
const both = { Términos: terms, Privacidad: privacy };

const section = (text, id, nextId) => text.slice(text.indexOf(`id: "${id}"`), nextId ? text.indexOf(`id: "${nextId}"`) : undefined);

test("datos de contacto confirmados y sin identidad jurídica inventada", () => {
  assert.deepEqual(LEGAL_OWNER, {
    location: "Lima, Perú",
    email: "bytepath.learning.contact@gmail.com",
    jurisdiction: "Perú",
  });
  assert.equal(LEGAL_DRAFT, false, "sin campos pendientes no hay aviso de versión preliminar");
});

test("versiones: Términos 1.1 y Política 1.0 publicadas", () => {
  assert.equal(TERMS_VERSION, "1.1");
  assert.equal(legalDocuments.terms.version, TERMS_VERSION);
  assert.equal(legalDocuments.privacy.version, "1.0");
  assert.ok(legalDocuments.terms.updatedAt && legalDocuments.privacy.updatedAt);
});

test("ningún documento contiene marcadores pendientes ni una identidad jurídica inventada", () => {
  for (const [name, source] of [["Términos", termsSource], ["Privacidad", privacySource]]) {
    assert.doesNotMatch(source, /<Pending|\[[A-ZÁÉÍÓÚÑ /,.]{4,}\]|\bTODO\b|PENDIENTE/, name);
    assert.doesNotMatch(source, /S\.A\.C|S\.R\.L|\bRUC\b|razón social|representante legal|responsable legal/i, name);
    assert.doesNotMatch(source, /Owner field="responsible"|legalName|taxId/, name);
  }
  // «persona jurídica» solo puede aparecer para decir que BytePath NO lo es.
  for (const [name, text] of Object.entries(both)) {
    for (const match of text.matchAll(/.{0,40}persona jurídica/g)) {
      assert.match(match[0], /No es una empresa ni una persona jurídica/, `${name}: ${match[0]}`);
    }
  }
});

test("ambos documentos se identifican igual: proyecto de estudiantes, correo y Perú", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /proyecto educativo desarrollado por un equipo de estudiantes/, name);
    assert.match(text, /Owner field="email"/, name);
    assert.match(text, /Owner field="jurisdiction"|Owner field="location"/, name);
  }
});

test("registro 14+: declaración, validada en el servidor, sin guardar la edad, sin atribuirla a la ley", () => {
  const minors = section(terms, "menores", "privacidad");
  assert.match(minors, /Confirmo que tengo 14 años o más/);
  assert.match(minors, /no solicita ni almacena tu fecha de nacimiento ni tu edad exacta/);
  assert.match(minors, /no una edad mínima general/);
  assert.match(minors, /primero tendrá que implementar las medidas necesarias/);

  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /declaración/, `${name}: la casilla es una declaración`);
    assert.match(text, /el servidor vuelve a comprobar/, `${name}: validación en el servidor`);
    assert.match(text, /no se guarda|no se almacena/, `${name}: la confirmación no se guarda`);
    assert.doesNotMatch(text, /tiene que dar su consentimiento para|edad mínima legal|la ley peruana exige|solo puede ser utilizado por/i, name);
    assert.doesNotMatch(text, /(guardamos|almacenamos|registramos) (tu|la) (edad|fecha de nacimiento)/i, name);
    assert.doesNotMatch(text, /consentimiento parental (implementado|disponible)|verificamos tu edad/i, name);
  }
});

test("Judge0 y Supabase descritos igual en ambos documentos", () => {
  for (const [name, text] of Object.entries(both)) {
    assert.match(text, /ce\.judge0\.com/, name);
    assert.match(text, /no ha verificado durante cuánto tiempo lo conserva/, name);
    assert.match(text, /información personal, contraseñas, tokens, claves privadas u otros secretos/, name);
    assert.match(text, /no le envía tu correo|No<\/Term> se le envían tu correo/, name);
    assert.match(text, /Supabase/, name);
  }
});

test("sin promesas que el código no cumple", () => {
  for (const [name, text] of Object.entries(both)) {
    // Anonimización: solo para negarla.
    for (const match of text.matchAll(/.{0,30}anonimiz[a-záéíóúñ]*/gi)) {
      assert.match(match[0], /no de anonimización/, `${name}: ${match[0]}`);
    }
    assert.doesNotMatch(text, /(descargar|descarga|exportar) (absolutamente )?todos (tus|los) datos/i, name);
    assert.doesNotMatch(text, /(se borra|se elimina|eliminamos|borramos)[^.]{0,40}(al instante|inmediatamente|de inmediato)/i, name);
    assert.doesNotMatch(text, /completamente seguro(?! y no)|seguridad (total|absoluta)|100 ?%/i, name);
    // Plazos: solo los que existen en el código (cookie de 30 días, contadores de dos días).
    for (const match of text.matchAll(/\b(\d+|dos|tres|seis)\s+(días|meses|años|semanas)\b/gi)) {
      assert.match(match[0], /^(30 días|dos días|14 años|18 años)$/i, `${name}: plazo no respaldado «${match[0]}»`);
    }
  }
});

test("Política: cookie no HttpOnly, IP seudonimizada y exportación con sus límites", () => {
  assert.match(privacy, /no es HttpOnly/);
  assert.match(privacy, /30 días/);
  assert.match(privacy, /SameSite=Lax/);
  assert.match(privacy, /code-verifier/);
  assert.match(privacy, /bytepath-theme/);
  assert.match(privacy, /seudonimización/);
  assert.match(privacy, /Qué no incluye/);
  assert.match(privacy, /no hay una opción en la interfaz para cambiar tu correo ni tu nombre de usuario/);
  assert.match(privacy, /no vendemos datos personales|no vende datos personales/i);
});
