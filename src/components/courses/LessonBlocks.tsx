import { CalloutBlock } from "@/components/courses/CalloutBlock";
import { CodeBlock } from "@/components/courses/CodeBlock";
import { TraceBlock } from "@/components/courses/TraceBlock";
import type { ContentBlock } from "@/lib/courses/types";

/** Un bloque suelto. `LessonBody` (teoría) y `LessonBlocks` (enunciados) lo reutilizan. */
export function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-[15.5px] leading-7 text-fg-body">{block.text}</p>;

    case "heading":
      return (
        <h2 className="pt-4 font-display text-xl font-semibold tracking-tight">{block.text}</h2>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="text-[15.5px] leading-7 text-fg-body">
          {item}
        </li>
      ));
      return block.ordered ? (
        <ol className="list-decimal space-y-2 pl-5 marker:font-mono marker:text-sm marker:text-learn-ink">
          {items}
        </ol>
      ) : (
        <ul className="list-disc space-y-2 pl-5 marker:text-learn">{items}</ul>
      );
    }

    case "code":
      return <CodeBlock code={block.code} caption={block.caption} output={block.output} />;

    case "callout":
      return <CalloutBlock block={block} />;

    case "trace":
      return <TraceBlock block={block} />;
  }
}

export function LessonBlocks({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
        <p className="font-display text-lg font-semibold">Contenido en preparación</p>
        <p className="mx-auto mt-2 max-w-sm leading-7 text-fg-muted">
          Esta lección todavía no tiene teoría escrita. Mientras tanto, puedes continuar con el
          resto del curso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
