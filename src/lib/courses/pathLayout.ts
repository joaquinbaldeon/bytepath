/**
 * Geometría del camino de aprendizaje: DÓNDE va cada punto, no cómo se pinta.
 *
 * Es una función pura de la estructura del curso (cuántos módulos y cuántas
 * lecciones tiene cada uno, y sus slugs). No lee progreso, ni estados, ni el
 * ancho de la pantalla: por eso el resultado es estable entre renders y es el
 * mismo en el servidor y en el navegador. Lo que cambia con el ancho (cuánto
 * serpentea, dónde está el centro) lo resuelve el CSS sobre estos datos.
 *
 * Cada punto tiene una posición lateral `o` en [-1, 1] —un número sin unidades
 * que el CSS convierte en píxeles según el espacio disponible— y una `y` en
 * píxeles reales. Los puntos se unen con curvas de Bézier cuyas tangentes son
 * verticales en cada nodo: el camino llega y sale de cada lección recto y entre
 * una y otra se desplaza en una S suave.
 *
 * El recorrido no es una fórmula (ni "izquierda, derecha, izquierda"): es un
 * paseo con inercia. Lleva una dirección durante 2 a 4 puntos, cambia de
 * sentido al cabo de esa racha o al tocar el borde, y de vez en cuando se
 * detiene casi en el sitio. La semilla sale de los slugs del curso, así que
 * cada curso tiene SU forma y esa forma no cambia nunca por sí sola.
 *
 * Los límites de cada paso están pensados para el texto: un salto lateral
 * demasiado grande entre dos lecciones haría que la curva pasara por encima de
 * la etiqueta de la vecina. Por eso hay un tope distinto según el tipo de paso.
 */

export const PATH_METRICS = {
  /** Alto de la cabecera de un módulo (título, resumen y progreso). */
  head: 160,
  /**
   * Alto de cada lección. Lo que cabe en una fila en el caso más estrecho (chip,
   * título a dos líneas y detalle a una) son unos 100 px: 108 deja aire.
   */
  row: 108,
  /** A qué altura, desde el tope del módulo, está el empalme de su cabecera. */
  junctionY: 30,
} as const;

/** Hasta dónde se aleja del centro el camino (±). El resto del ancho es para el texto. */
const MAX_OFFSET = 0.8;

/** Tope del salto lateral entre dos puntos consecutivos, según de qué a qué. */
const STEP_CAP = {
  lessonToLesson: 0.55,
  /** La cabecera tiene texto pegado al empalme: aquí el camino se mueve poco. */
  junctionToLesson: 0.35,
  lessonToJunction: 0.5,
} as const;

export type PathSide = "left" | "right";
export type PointKind = "junction" | "lesson";

export type LaidPoint = {
  kind: PointKind;
  /** Posición lateral en [-1, 1]; 0 es el centro del carril. */
  o: number;
  /** Altura absoluta, en píxeles, desde el inicio del camino. */
  y: number;
  /** De qué lado va el texto de este punto. */
  side: PathSide;
  module: number;
  /** Índice de la lección dentro del módulo; -1 en el empalme. */
  lesson: number;
};

export type LaidModule = {
  /** Altura absoluta a la que empieza el módulo. */
  top: number;
  height: number;
  junction: LaidPoint;
  lessons: LaidPoint[];
};

export type PathLayout = {
  modules: LaidModule[];
  /** Todos los puntos en orden de recorrido: empalme, lecciones, empalme, lecciones... */
  points: LaidPoint[];
  height: number;
};

export type PathShape = { slug: string; lessons: number }[];

/* --------------------------------- Azar fijo -------------------------------- */

/** FNV-1a de 32 bits: una semilla a partir de texto. */
function hashSeed(parts: string[]): number {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      hash ^= part.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    hash ^= 0x7c; // separador: ["ab","c"] no debe dar lo mismo que ["a","bc"]
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32: generador con semilla. Mismo inicio, misma secuencia, siempre. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------ Paseo lateral ------------------------------- */

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
const round = (value: number) => Math.round(value * 1000) / 1000;

/** Una racha: cuántos puntos seguidos va en la misma dirección (2, 3 o 4). */
const runLength = (random: () => number) => 2 + Math.floor(random() * 3);

function walk(kinds: PointKind[], random: () => number): number[] {
  const offsets: number[] = [];
  let offset = (random() - 0.5) * 0.3; // arranca cerca del centro
  let direction = random() < 0.5 ? -1 : 1;
  let run = runLength(random);

  kinds.forEach((kind, index) => {
    if (index === 0) {
      offsets.push(round(offset));
      return;
    }

    const previous = kinds[index - 1];
    const cap =
      kind === "junction"
        ? STEP_CAP.lessonToJunction
        : previous === "junction"
          ? STEP_CAP.junctionToLesson
          : STEP_CAP.lessonToLesson;

    // De vez en cuando, casi sin moverse: es lo que rompe el ritmo de ola.
    const resting = random() < 0.14;
    const magnitude = resting ? 0.04 + random() * 0.08 : cap * (0.4 + 0.6 * random());

    if (run <= 0) {
      direction = -direction;
      run = runLength(random);
    }

    let next = offset + direction * magnitude;
    if (Math.abs(next) > MAX_OFFSET) {
      // Tocó el borde: vuelve hacia dentro en vez de quedarse pegado a él.
      direction = -direction;
      run = runLength(random);
      next = offset + direction * magnitude;
    }

    if (!resting) run -= 1;
    offset = clamp(next, MAX_OFFSET);
    offsets.push(round(offset));
  });

  return offsets;
}

/* ------------------------------ Lado del texto ------------------------------ */

/**
 * Las estimaciones de ancho con las que se decide el lado del texto. Son las de
 * una pantalla ancha (centro en el 50%, recorrido de ±30%): en móvil el CSS
 * ignora el lado y alinea todo el texto en una columna, así que aquí solo hace
 * falta acertar para donde hay sitio de sobra.
 */
const ESTIMATE = { center: 0.5, amplitude: 0.3, gutter: 0.06, minRoom: 0.36 } as const;

function chooseSide(offsets: number[], index: number): PathSide {
  const x = ESTIMATE.center + ESTIMATE.amplitude * offsets[index];
  const leftRoom = x - ESTIMATE.gutter;
  const rightRoom = 1 - ESTIMATE.gutter - x;

  const leftFits = leftRoom >= ESTIMATE.minRoom;
  const rightFits = rightRoom >= ESTIMATE.minRoom;
  if (leftFits !== rightFits) return leftFits ? "left" : "right";

  // Caben los dos (o ninguno): el texto va en el lado al que el camino NO se
  // dirige, para que la curva que sale del nodo no pase por encima de él.
  const before = offsets[Math.max(0, index - 1)];
  const after = offsets[Math.min(offsets.length - 1, index + 1)];
  const heading = after - before;
  if (Math.abs(heading) > 0.02) return heading > 0 ? "left" : "right";
  return rightRoom >= leftRoom ? "right" : "left";
}

/* --------------------------------- Conjunto --------------------------------- */

export function layoutPath(shape: PathShape): PathLayout {
  const { head, row, junctionY } = PATH_METRICS;

  const kinds: PointKind[] = [];
  for (const section of shape) {
    kinds.push("junction");
    for (let i = 0; i < section.lessons; i++) kinds.push("lesson");
  }

  const offsets = walk(kinds, mulberry32(hashSeed(shape.flatMap((section) => [section.slug, String(section.lessons)]))));

  const points: LaidPoint[] = [];
  const modules: LaidModule[] = [];
  let top = 0;
  let cursor = 0;

  shape.forEach((section, moduleIndex) => {
    const junction: LaidPoint = {
      kind: "junction",
      o: offsets[cursor],
      y: top + junctionY,
      side: chooseSide(offsets, cursor),
      module: moduleIndex,
      lesson: -1,
    };
    cursor += 1;
    points.push(junction);

    const lessons: LaidPoint[] = [];
    for (let i = 0; i < section.lessons; i++) {
      const point: LaidPoint = {
        kind: "lesson",
        o: offsets[cursor],
        y: top + head + i * row + row / 2,
        side: chooseSide(offsets, cursor),
        module: moduleIndex,
        lesson: i,
      };
      cursor += 1;
      lessons.push(point);
      points.push(point);
    }

    const height = head + section.lessons * row;
    modules.push({ top, height, junction, lessons });
    top += height;
  });

  return { modules, points, height: top };
}

/* ---------------------------------- Curvas ---------------------------------- */

/**
 * Tramo entre dos puntos consecutivos, en las coordenadas del SVG (x = `o`,
 * y = píxeles). Bézier cúbica con las dos tangentes verticales: sale recta del
 * nodo de arriba, se desplaza en una S y llega recta al de abajo. Si los dos
 * están alineados, una recta.
 *
 * Saliendo de un empalme la curva espera más antes de desplazarse, para no
 * invadir el texto de la cabecera que tiene al lado.
 */
export function curve(from: LaidPoint, to: LaidPoint): string {
  if (Math.abs(from.o - to.o) < 0.0005) return `M ${from.o} ${from.y} L ${to.o} ${to.y}`;

  const dy = to.y - from.y;
  const leaving = from.kind === "junction" ? 0.72 : 0.5;
  const arriving = from.kind === "junction" ? 0.28 : 0.5;

  return `M ${from.o} ${from.y} C ${from.o} ${round(from.y + dy * leaving)} ${to.o} ${round(to.y - dy * arriving)} ${to.o} ${to.y}`;
}
