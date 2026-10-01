import { BlockView, LessonBlocks } from "@/components/courses/LessonBlocks";
import { composeBlocks, type FeatureBlock, type ProseBlock } from "@/lib/courses/composeBlocks";
import type { ContentBlock } from "@/lib/courses/types";

/**
 * El cuerpo de la teoría de una lección, compuesto en filas.
 *
 * Qué va con qué lo decide `composeBlocks` (una función pura de los datos); esto
 * solo pinta cada fila. El reparto en columnas lo hace el CSS según el ancho del
 * ÁREA (container queries sobre el espacio de la lección), así que no hay
 * medición en JavaScript ni salto al cargar:
 *
 *   · menos de 64rem de área:  una columna, en el orden de lectura de siempre;
 *   · desde 64rem:             "texto | ejemplo" en dos columnas;
 *   · desde 80rem:             la columna del ejemplo gana peso (5 : 7).
 *
 * El texto nunca pasa de ~34rem (unos 62 caracteres por línea): el espacio de
 * más se usa para poner el ejemplo AL LADO, no para alargar las líneas.
 */

const prose = "max-w-[34rem] min-w-0 space-y-5";

function Prose({ blocks, pinned = false }: { blocks: ProseBlock[]; pinned?: boolean }) {
  return (
    // `pinned`: en una fila de dos columnas el texto se queda a la vista mientras
    // se recorre un ejemplo alto, en vez de dejar un hueco debajo.
    <div className={`${prose} ${pinned ? "@5xl:sticky @5xl:top-20" : ""}`}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

/** Los ejemplos ocupan el ancho que su contenido pide, con un tope por tipo. */
const featureWidth: Record<FeatureBlock["type"], string> = {
  code: "max-w-[50rem]",
  callout: "max-w-[42rem]",
  trace: "max-w-full",
};

export function LessonBody({ blocks }: { blocks: ContentBlock[] }) {
  // Sin contenido sigue saliendo el aviso de "en preparación" de siempre.
  if (blocks.length === 0) return <LessonBlocks blocks={blocks} />;

  return (
    <div className="flex flex-col gap-8 @5xl:gap-12">
      {composeBlocks(blocks).map((row, i) => {
        switch (row.kind) {
          case "heading":
            return (
              <h2
                key={i}
                className="max-w-3xl pt-2 font-display text-xl font-semibold tracking-tight text-balance @5xl:text-2xl"
              >
                {row.block.text}
              </h2>
            );

          case "prose":
            return <Prose key={i} blocks={row.blocks} />;

          case "split":
            return (
              <div
                key={i}
                className="grid min-w-0 gap-6 @5xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] @5xl:items-start @5xl:gap-12 @7xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
              >
                <Prose blocks={row.prose} pinned />
                <div className="min-w-0 space-y-5">
                  {row.features.map((feature, j) => (
                    <BlockView key={j} block={feature} />
                  ))}
                </div>
              </div>
            );

          case "feature":
            return (
              <div key={i} className={`min-w-0 ${featureWidth[row.block.type]}`}>
                <BlockView block={row.block} />
              </div>
            );
        }
      })}
    </div>
  );
}
