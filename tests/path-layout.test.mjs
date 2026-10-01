// Geometría del camino de aprendizaje (src/lib/courses/pathLayout.ts).
// Es una función pura, así que se prueba directamente: que sea estable, que funcione con cualquier
// tamaño de curso, que respete los límites que protegen el texto y que NO sea un zigzag regular.
import assert from "node:assert/strict";
import { test } from "node:test";
import { curve, layoutPath, PATH_METRICS } from "../src/lib/courses/pathLayout.ts";

const shapeOf = (slug, modules, perModule) =>
  Array.from({ length: modules }, (_, i) => ({ slug: `${slug}-m${i + 1}`, lessons: perModule }));

const caps = { lessonToLesson: 0.55, junctionToLesson: 0.35, lessonToJunction: 0.5 };

test("estable: la misma estructura da siempre exactamente el mismo camino", () => {
  const shape = shapeOf("cpp", 8, 4);
  assert.deepEqual(layoutPath(shape), layoutPath(shape));
  assert.deepEqual(layoutPath(shape), layoutPath(structuredClone(shape)));
});

test("cada curso tiene su forma: otros slugs dan otro recorrido", () => {
  const a = layoutPath(shapeOf("cpp", 6, 4)).points.map((p) => p.o);
  const b = layoutPath(shapeOf("competitiva", 6, 4)).points.map((p) => p.o);
  assert.notDeepEqual(a, b);
});

test("funciona con cualquier tamaño: de 1 lección a cientos, de 1 módulo a muchos", () => {
  for (const modules of [1, 2, 3, 5, 8, 12]) {
    for (const perModule of [1, 2, 4, 6, 10]) {
      const layout = layoutPath(shapeOf(`c${modules}x${perModule}`, modules, perModule));
      assert.equal(layout.modules.length, modules);
      assert.equal(layout.points.length, modules * (perModule + 1));
      assert.equal(layout.height, modules * (PATH_METRICS.head + perModule * PATH_METRICS.row));
      for (const point of layout.points) {
        assert.ok(Number.isFinite(point.o) && Number.isFinite(point.y));
        assert.ok(Math.abs(point.o) <= 0.8 + 1e-9, `fuera del carril: ${point.o}`);
        assert.ok(point.side === "left" || point.side === "right");
      }
    }
  }
});

test("un curso sin módulos, o con un módulo vacío, no rompe nada", () => {
  assert.deepEqual(layoutPath([]), { modules: [], points: [], height: 0 });
  const empty = layoutPath([{ slug: "vacio", lessons: 0 }]);
  assert.equal(empty.points.length, 1);
  assert.equal(empty.height, PATH_METRICS.head);
});

test("las alturas crecen siempre hacia abajo y cada lección cae dentro de su módulo", () => {
  const layout = layoutPath(shapeOf("cpp", 8, 4));
  for (let i = 1; i < layout.points.length; i++) {
    assert.ok(layout.points[i].y > layout.points[i - 1].y, `el punto ${i} no baja`);
  }
  for (const section of layout.modules) {
    for (const lesson of section.lessons) {
      assert.ok(lesson.y > section.top + PATH_METRICS.head && lesson.y < section.top + section.height);
    }
    assert.equal(section.junction.y, section.top + PATH_METRICS.junctionY);
  }
});

test("los saltos laterales respetan su tope: la curva nunca pasa por encima del texto vecino", () => {
  for (const seed of ["cpp", "intro", "grafos", "dp", "a", "b", "c", "d", "e", "f"]) {
    const { points } = layoutPath(shapeOf(seed, 8, 5));
    for (let i = 1; i < points.length; i++) {
      const cap =
        points[i].kind === "junction"
          ? caps.lessonToJunction
          : points[i - 1].kind === "junction"
            ? caps.junctionToLesson
            : caps.lessonToLesson;
      const step = Math.abs(points[i].o - points[i - 1].o);
      assert.ok(step <= cap + 1e-9, `${seed}: salto de ${step} > tope ${cap} en el punto ${i}`);
    }
  }
});

test("NO es un zigzag: rachas, amplitud variable y pausas", () => {
  for (const seed of ["cpp", "intro", "grafos", "dp", "x1", "x2"]) {
    const offsets = layoutPath(shapeOf(seed, 8, 4)).points.map((p) => p.o);
    const signs = [];
    for (let i = 1; i < offsets.length; i++) {
      const d = offsets[i] - offsets[i - 1];
      if (Math.abs(d) > 0.02) signs.push(Math.sign(d));
    }

    // Alternar en cada paso daría (casi) tantos cambios de sentido como pasos.
    const changes = signs.filter((s, i) => i > 0 && s !== signs[i - 1]).length;
    assert.ok(changes < signs.length * 0.6, `${seed}: demasiados cambios de sentido (${changes}/${signs.length})`);

    // Y debe haber al menos una racha de 2 o más puntos en la misma dirección.
    let longest = 1;
    let run = 1;
    for (let i = 1; i < signs.length; i++) {
      run = signs[i] === signs[i - 1] ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    assert.ok(longest >= 2, `${seed}: ninguna racha`);

    // Recorre buena parte del ancho disponible, no una franja estrecha.
    assert.ok(Math.max(...offsets) - Math.min(...offsets) >= 0.9, `${seed}: recorrido demasiado estrecho`);

    // Los tamaños de salto son variados (no una amplitud única repetida).
    const sizes = new Set(signs.map((_, i) => Math.round(Math.abs(offsets[i + 1] - offsets[i]) * 10)));
    assert.ok(sizes.size >= 4, `${seed}: saltos demasiado uniformes`);
  }
});

test("el texto nunca va hacia donde se dirige el camino cuando hay sitio para elegir", () => {
  const { points } = layoutPath(shapeOf("cpp", 8, 5));
  let checked = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const heading = points[i + 1].o - points[i - 1].o;
    const x = 0.5 + 0.3 * points[i].o;
    const bothFit = x - 0.06 >= 0.36 && 1 - 0.06 - x >= 0.36;
    if (bothFit && Math.abs(heading) > 0.02) {
      checked += 1;
      assert.equal(points[i].side, heading > 0 ? "left" : "right");
    }
  }
  assert.ok(checked > 3, "no había casos que comprobar");
});

test("las curvas salen y llegan en vertical: el camino entra recto en cada nodo", () => {
  const { points } = layoutPath(shapeOf("cpp", 2, 4));
  for (let i = 1; i < points.length; i++) {
    const d = curve(points[i - 1], points[i]);
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    if (d.includes("C")) {
      const [x0, , cx1, , cx2, , x1] = nums;
      assert.equal(cx1, x0, "la tangente de salida no es vertical");
      assert.equal(cx2, x1, "la tangente de llegada no es vertical");
    } else {
      assert.equal(nums[0], nums[2], "un tramo recto debe ser vertical");
    }
    assert.ok(!d.includes("NaN"));
  }
});
