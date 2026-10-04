// Tope global diario de ejecuciones (src/lib/execution/budget.ts): la parte pura.
// La cuenta real vive en Supabase (consume_rate_limit); aquí se prueba que la variable se lee
// bien, que los avisos saltan una sola vez por umbral y que el mensaje de espera es legible.
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertCrossed, describeWait, parseDailyRunLimit } from "../src/lib/execution/budget.ts";

test("sin variable, o con un valor roto, no hay tope (nunca un tope por accidente)", () => {
  for (const raw of [undefined, "", "  ", "abc", "-5", "0", "1.5", "1e3", "12 ejecuciones", "NaN"]) {
    assert.equal(parseDailyRunLimit(raw), null, `valor: ${JSON.stringify(raw)}`);
  }
});

test("un entero positivo es el tope, con espacios alrededor tolerados", () => {
  assert.equal(parseDailyRunLimit("150"), 150);
  assert.equal(parseDailyRunLimit(" 150 "), 150);
  assert.equal(parseDailyRunLimit("1"), 1);
});

test("un número fuera del rango seguro de enteros no se toma como tope", () => {
  assert.equal(parseDailyRunLimit("99999999999999999999"), null);
});

test("los avisos saltan en el 50 %, el 80 % y el 100 %, y en ninguna otra ejecución", () => {
  const hits = [];
  for (let used = 1; used <= 150; used++) {
    const percent = alertCrossed(used, 150);
    if (percent !== null) hits.push([used, percent]);
  }
  assert.deepEqual(hits, [
    [75, 50],
    [120, 80],
    [150, 100],
  ]);
});

test("con topes pequeños cae más de un umbral en la misma ejecución: se avisa del más alto", () => {
  assert.equal(alertCrossed(1, 1), 100);
  const seen = [];
  for (let used = 1; used <= 3; used++) seen.push(alertCrossed(used, 3));
  // 50 % de 3 = 2; 80 % = 3 y 100 % = 3 (se avisa del 100 %).
  assert.deepEqual(seen, [null, 50, 100]);
});

test("una ejecución por encima del tope no vuelve a avisar", () => {
  assert.equal(alertCrossed(151, 150), null);
});

test("la espera se dice en minutos si es corta y en horas si es larga", () => {
  assert.equal(describeWait(1), "1 min");
  assert.equal(describeWait(59), "1 min");
  assert.equal(describeWait(61), "2 min");
  assert.equal(describeWait(45 * 60), "45 min");
  assert.equal(describeWait(3 * 3600), "3 h");
  assert.equal(describeWait(3 * 3600 + 1), "4 h");
  assert.equal(describeWait(0), "1 min");
});
