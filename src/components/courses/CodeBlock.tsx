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
    // `min-w-0 max-w-full`: un ejemplo ancho scrollea por dentro (el `pre`) en
    // vez de ensanchar la columna y provocar scroll horizontal en la página.
    <div
      className={`min-w-0 max-w-full overflow-hidden rounded-xl border border-code-line bg-code shadow-soft ${className}`}
    >
      {caption && (
        <div className="flex items-center gap-3 border-b border-code-line px-4 py-2.5 sm:px-5">
          {/* Los tres puntos de la ventana de un editor: el rótulo es un nombre de archivo. */}
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-700" />
            <span className="size-2.5 rounded-full bg-slate-700" />
            <span className="size-2.5 rounded-full bg-slate-700" />
          </span>
          <p className="min-w-0 truncate font-mono text-xs text-slate-400">{caption}</p>
        </div>
      )}

      <pre className="overflow-x-auto px-4 py-5 font-mono text-[12.5px] leading-6 sm:px-5 @7xl:text-[13px]">
        <code>
          {lines.map((tokens, i) => (
            <div
              key={i}
              className={`flex ${
                highlightLine === i + 1
                  ? "-mx-4 border-l-2 border-learn bg-learn/10 pr-4 pl-[calc(1rem-2px)] sm:-mx-5 sm:pr-5 sm:pl-[calc(1.25rem-2px)]"
                  : ""
              }`}
            >
              <span className="w-8 shrink-0 pr-4 text-right text-slate-600 select-none">
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
        <div className="border-t border-code-line px-4 py-3.5 sm:px-5">
          <p className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">Salida</p>
          <pre className="mt-1.5 overflow-x-auto font-mono text-[12.5px] whitespace-pre text-slate-200 @7xl:text-[13px]">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
