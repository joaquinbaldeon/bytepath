import { tokenClassNames, tokenizeCpp } from "@/lib/syntax/cpp";

export function CodeBlock({
  code,
  caption,
  output,
  highlightLine,
  className = "",
}: {
  code: string;
  caption?: string;
  output?: string;
  /** Línea resaltada (empezando en 1), para los ejemplos paso a paso. */
  highlightLine?: number;
  className?: string;
}) {
  const lines = tokenizeCpp(code);

  return (
    // El código se ve igual en ambos temas: fondo oscuro y grises fijos, para
    // que el resaltado no cambie de significado al cambiar de tema.
    <div
      className={`overflow-hidden rounded-xl border border-code-line bg-code ${className}`}
    >
      {caption && (
        <p className="border-b border-code-line px-4 py-2.5 font-mono text-[11px] text-slate-400">
          {caption}
        </p>
      )}

      <pre className="overflow-x-auto px-3 py-4 font-mono text-[13px] leading-6 sm:px-4">
        <code>
          {lines.map((tokens, i) => (
            <div
              key={i}
              className={`flex ${
                highlightLine === i + 1
                  ? "-mx-3 border-l-2 border-learn bg-learn/10 pr-3 pl-[calc(0.75rem-2px)] sm:-mx-4 sm:pr-4 sm:pl-[calc(1rem-2px)]"
                  : ""
              }`}
            >
              <span className="w-7 shrink-0 pr-4 text-right text-slate-600 select-none">
                {i + 1}
              </span>
              <span className="whitespace-pre">
                {tokens.map((token, j) => (
                  <span key={j} className={tokenClassNames[token.kind]}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>

      {output && (
        <div className="border-t border-code-line px-4 py-3">
          <p className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">Salida</p>
          <pre className="mt-1.5 overflow-x-auto font-mono text-[13px] whitespace-pre text-slate-200">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
