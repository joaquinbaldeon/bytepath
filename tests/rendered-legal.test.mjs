// Lo que ve el usuario: las páginas servidas por BytePath. Necesita un servidor en marcha
// (`next dev` o `next start`) y su dirección en BYTEPATH_BASE_URL, por ejemplo:
//   BYTEPATH_BASE_URL=http://localhost:3000 npm test
// Sin esa variable, estas pruebas se omiten.
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE = process.env.BYTEPATH_BASE_URL;
const skip = BASE ? false : "define BYTEPATH_BASE_URL para probar las páginas servidas";

async function page(path) {
  const res = await fetch(new URL(path, BASE));
  assert.equal(res.status, 200, `${path} → ${res.status}`);
  return res.text();
}

test("9/10/11) /terminos: correo de contacto, jurisdicción Perú y ningún marcador pendiente", { skip }, async () => {
  const html = await page("/terminos");
  assert.match(html, /href="mailto:bytepath\.learning\.contact@gmail\.com"/);
  assert.match(html, /se rigen por la legislación de <!-- -->Perú|se rigen por la legislación de Perú/);
  assert.match(html, /proyecto educativo desarrollado por un equipo de estudiantes/);
  assert.match(html, /Lima, Perú/);
  assert.match(html, /Versión <!-- -->1\.1|Versión 1\.1/);
  assert.doesNotMatch(html, /\[CORREO DE CONTACTO\]|\[PAÍS \/ JURISDICCIÓN\]|\[REVISAR CON UN PROFESIONAL\]|\[RESPONSABLE|\[DOMICILIO|\[UBICACIÓN\]|\[NOMBRE LEGAL\]|\[RUC/);
  assert.doesNotMatch(html, /Versión preliminar|en preparación|Responsable: /);
  assert.doesNotMatch(html, /noindex/);
});

test("/privacidad: política publicada, mismo contacto y sin marcadores", { skip }, async () => {
  const html = await page("/privacidad");
  assert.match(html, /href="mailto:bytepath\.learning\.contact@gmail\.com"/);
  assert.match(html, /proyecto educativo desarrollado por un equipo de estudiantes/);
  assert.match(html, /Versión <!-- -->1\.0|Versión 1\.0/);
  assert.match(html, /ce\.judge0\.com/);
  assert.match(html, /HttpOnly/);
  assert.doesNotMatch(html, /\[[A-ZÁÉÍÓÚÑ /]{4,}\]/);
  assert.doesNotMatch(html, /Versión preliminar|en preparación|Estado: /);
  assert.doesNotMatch(html, /noindex/);
});

test("7/8) /registro: las dos casillas, separadas y obligatorias", { skip }, async () => {
  const html = await page("/registro");
  const boxes = [...html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map((m) => m[0]);
  assert.equal(boxes.length, 2);
  assert.ok(boxes.some((b) => /name="confirmAge"/.test(b) && /required/.test(b)));
  assert.ok(boxes.some((b) => /name="acceptTerms"/.test(b) && /required/.test(b)));
  assert.match(html, /Confirmo que tengo 14 años o más\./);
  assert.doesNotMatch(html, /type="date"|name="(birth|age|edad|dni)/i);
});
