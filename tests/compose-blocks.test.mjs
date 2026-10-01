// Composición de la teoría de una lección (src/lib/courses/composeBlocks.ts).
// Lo que importa: que el ORDEN de lectura no cambie nunca, que no se pierda ningún bloque y que las
// reglas de agrupación hagan lo que dicen (código corto junto a su texto, largo a ancho completo).
import assert from "node:assert/strict";
import { test } from "node:test";
import { composeBlocks, isCompact } from "../src/lib/courses/composeBlocks.ts";

const p = (text) => ({ type: "paragraph", text });
const h = (text) => ({ type: "heading", text });
const code = (lines, width = 20) => ({
  type: "code",
  code: Array.from({ length: lines }, (_, i) => `int x${i} = ${"1".repeat(Math.max(1, width - 10))};`).join("\n"),
});
const callout = { type: "callout", variant: "tip", text: "Un consejo." };
const trace = { type: "trace", code: "int a;", steps: [{ line: 1, explanation: "x" }] };

/** Aplana las filas en el orden en el que se leen. */
const flat = (rows) =>
  rows.flatMap((row) => {
    switch (row.kind) {
      case "heading":
        return [row.block];
      case "prose":
        return row.blocks;
      case "split":
        return [...row.prose, ...row.features];
      case "feature":
        return [row.block];
    }
  });

test("el orden de lectura no cambia y no se pierde ni se duplica ningún bloque", () => {
  const blocks = [p("a"), p("b"), code(6), h("t"), p("c"), callout, p("d"), code(40), trace, p("e")];
  assert.deepEqual(flat(composeBlocks(blocks)), blocks);
});

test("un código corto va junto al párrafo que lo introduce", () => {
  const rows = composeBlocks([p("Introducción"), code(6)]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, "split");
  assert.equal(rows[0].prose.length, 1);
});

test("un aviso se agrupa con su texto", () => {
  const rows = composeBlocks([p("Concepto"), callout]);
  assert.equal(rows[0].kind, "split");
  assert.equal(rows[0].features[0].type, "callout");
});

test("un aviso justo detrás de un ejemplo se apila bajo él, en su misma fila", () => {
  const rows = composeBlocks([p("Texto"), code(5), callout, p("Siguiente")]);
  assert.deepEqual(rows.map((r) => r.kind), ["split", "prose"]);
  assert.deepEqual(rows[0].features.map((f) => f.type), ["code", "callout"]);
});

test("solo se apila un aviso: el segundo aviso seguido, o un aviso tras un párrafo, no", () => {
  const two = composeBlocks([p("Texto"), code(5), callout, callout]);
  assert.deepEqual(two.map((r) => r.kind), ["split", "feature"]);
  const after = composeBlocks([p("Texto"), code(5), p("Otro"), callout]);
  assert.deepEqual(after.map((r) => r.kind), ["split", "split"]);
});

test("un aviso tras un código a ancho completo no se apila: no hay columna a la que unirse", () => {
  const rows = composeBlocks([p("Texto"), code(40), callout]);
  assert.deepEqual(rows.map((r) => r.kind), ["prose", "feature", "feature"]);
});

test("un código largo o ancho ocupa la fila entera", () => {
  assert.equal(isCompact(code(40)), false, "demasiadas líneas");
  assert.equal(isCompact(code(22)), true, "un ejemplo alto pero estrecho va junto a su texto");
  assert.equal(isCompact(code(5, 90)), false, "demasiado ancho");
  assert.equal(isCompact(code(8, 30)), true);
  const rows = composeBlocks([p("Texto"), code(40)]);
  assert.deepEqual(rows.map((r) => r.kind), ["prose", "feature"]);
});

test("la traza paso a paso nunca se encierra en media columna", () => {
  const rows = composeBlocks([p("Mira"), trace]);
  assert.deepEqual(rows.map((r) => r.kind), ["prose", "feature"]);
});

test("un título abre sección: nada se agrupa a través de él", () => {
  const rows = composeBlocks([p("antes"), h("Sección"), code(5)]);
  assert.deepEqual(rows.map((r) => r.kind), ["prose", "heading", "feature"]);
});

test("sin texto delante, el ejemplo va solo; dos seguidos no se emparejan entre sí", () => {
  const rows = composeBlocks([code(5), code(5)]);
  assert.deepEqual(rows.map((r) => r.kind), ["feature", "feature"]);
});

test("con varios párrafos antes, solo el último (o los dos últimos, si son breves) se agrupan", () => {
  const rows = composeBlocks([p("uno"), p("dos"), p("tres"), code(5)]);
  assert.deepEqual(rows.map((r) => r.kind), ["prose", "split"]);
  assert.equal(rows[1].prose.length, 2, "dos breves se agrupan");

  const longText = "x".repeat(500);
  const rows2 = composeBlocks([p(longText), p(longText), code(5)]);
  assert.equal(rows2[1].prose.length, 1, "dos largos: solo el último");
  assert.equal(rows2[0].kind, "prose");
});

test("lista vacía y solo texto no rompen nada", () => {
  assert.deepEqual(composeBlocks([]), []);
  assert.deepEqual(composeBlocks([p("a"), p("b")]).map((r) => r.kind), ["prose"]);
});
