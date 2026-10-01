import type {
  Callout,
  CodeSample,
  CodeTrace,
  ContentBlock,
  HeadingBlock,
  ListBlock,
  ParagraphBlock,
} from "@/lib/courses/types";

/**
 * Composición de la teoría de una lección: cómo se reparten los bloques en filas.
 *
 * El contenido llega como una lista plana (párrafo, lista, código, aviso,
 * traza...) y siempre se lee de arriba abajo. En una pantalla ancha, esa lista
 * en una sola columna deja la mitad del ancho vacío; en vez de estirar el texto
 * (líneas ilegibles), esto agrupa los bloques en filas que el CSS reparte en
 * dos columnas cuando hay sitio y apila cuando no. El ORDEN de lectura no
 * cambia nunca: la fila "texto | ejemplo" se lee texto y luego ejemplo, igual
 * que apilada.
 *
 * Las reglas, pensadas para que no sea una rejilla artificial:
 *   · un título abre una sección y ocupa su propia fila;
 *   · un código CORTO, o un aviso, se pone junto al texto que lo introduce (el
 *     último párrafo o los dos últimos, si son breves);
 *   · un aviso que viene justo después de ese ejemplo se apila debajo de él, en
 *     la misma columna: así no se queda solo a un lado con el otro vacío;
 *   · un código largo o ancho, y las trazas paso a paso, ocupan la fila entera:
 *     necesitan su espacio, y encerrarlos en media columna los haría scrollear;
 *   · lo que no tiene texto delante (dos ejemplos seguidos, un título y su
 *     código) también va solo.
 *
 * Es una función pura de los datos: sin ancho de pantalla ni azar, así que el
 * resultado es el mismo en el servidor y en el navegador.
 */

export type ProseBlock = ParagraphBlock | ListBlock;
export type FeatureBlock = CodeSample | Callout | CodeTrace;

export type LessonRow =
  | { kind: "heading"; block: HeadingBlock }
  | { kind: "prose"; blocks: ProseBlock[] }
  | { kind: "split"; prose: ProseBlock[]; features: FeatureBlock[] }
  | { kind: "feature"; block: FeatureBlock };

/**
 * Un código cabe en media columna si es estrecho (se lee sin scroll horizontal) y
 * no es larguísimo. Alto no es un problema: un ejemplo alto junto a un texto corto
 * equilibra mejor que el mismo ejemplo solo con la otra mitad vacía.
 */
const COMPACT_CODE = { maxLines: 30, maxWidth: 54 } as const;

/** Dos párrafos se agrupan con su ejemplo solo si, juntos, no son un muro de texto. */
const MAX_PAIRED_CHARS = 640;

function proseLength(block: ProseBlock): number {
  return block.type === "paragraph" ? block.text.length : block.items.join(" ").length;
}

/** ¿Puede ir en media columna junto a su texto? */
export function isCompact(block: FeatureBlock): boolean {
  switch (block.type) {
    case "callout":
      return true;
    case "trace":
      return false;
    case "code": {
      const lines = block.code.split("\n");
      const widest = Math.max(...lines.map((line) => line.length));
      const outputWidest = block.output
        ? Math.max(...block.output.split("\n").map((line) => line.length))
        : 0;
      return (
        lines.length <= COMPACT_CODE.maxLines &&
        widest <= COMPACT_CODE.maxWidth &&
        outputWidest <= COMPACT_CODE.maxWidth
      );
    }
  }
}

const isProse = (block: ContentBlock): block is ProseBlock =>
  block.type === "paragraph" || block.type === "list";

const isFeature = (block: ContentBlock): block is FeatureBlock =>
  block.type === "code" || block.type === "callout" || block.type === "trace";

export function composeBlocks(blocks: ContentBlock[]): LessonRow[] {
  const rows: LessonRow[] = [];
  let run: ProseBlock[] = [];

  const flush = () => {
    if (run.length > 0) rows.push({ kind: "prose", blocks: run });
    run = [];
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      flush();
      rows.push({ kind: "heading", block });
      continue;
    }

    if (isProse(block)) {
      run.push(block);
      continue;
    }

    if (isFeature(block)) {
      // Un aviso detrás de un ejemplo que ya está en una fila de dos columnas: se apila debajo.
      const lastRow = rows[rows.length - 1];
      if (
        block.type === "callout" &&
        run.length === 0 &&
        lastRow?.kind === "split" &&
        lastRow.features.length === 1 &&
        lastRow.features[0].type === "code"
      ) {
        lastRow.features.push(block);
        continue;
      }

      if (run.length > 0 && isCompact(block)) {
        // Con el último párrafo; con los dos últimos si juntos son breves.
        const last = run[run.length - 1];
        const previous = run.length > 1 ? run[run.length - 2] : undefined;
        const takeTwo =
          previous !== undefined && proseLength(previous) + proseLength(last) <= MAX_PAIRED_CHARS;
        const paired = takeTwo ? run.slice(-2) : run.slice(-1);
        run = run.slice(0, run.length - paired.length);
        flush();
        rows.push({ kind: "split", prose: paired, features: [block] });
      } else {
        flush();
        rows.push({ kind: "feature", block });
      }
    }
  }

  flush();
  return rows;
}
