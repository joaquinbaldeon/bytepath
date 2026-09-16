// Resaltado de sintaxis mínimo para C++: suficiente para los ejemplos de las
// lecciones y sin dependencias externas. Trabaja línea a línea, así que solo
// reconoce comentarios de una línea.

export type TokenKind =
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "comment"
  | "preproc"
  | "function"
  | "operator"
  | "plain";

export type CodeToken = { text: string; kind: TokenKind };

const keywords =
  /^(?:auto|break|case|catch|class|const|continue|default|delete|do|else|false|for|if|namespace|new|nullptr|private|public|return|sizeof|struct|switch|template|this|throw|true|try|typename|using|while)\b/;

const types =
  /^(?:bool|char|double|float|int|long|map|pair|priority_queue|queue|set|short|signed|size_t|stack|string|unsigned|vector|void)\b/;

const rules: [RegExp, TokenKind][] = [
  [/^\/\/.*/, "comment"],
  [/^#\w+.*/, "preproc"],
  [/^"(?:\\.|[^"])*"/, "string"],
  [/^'(?:\\.|[^'])*'/, "string"],
  [/^\d+(?:\.\d+)?/, "number"],
  [keywords, "keyword"],
  [types, "type"],
  [/^[A-Za-z_]\w*(?=\s*\()/, "function"],
  [/^[A-Za-z_]\w*/, "plain"],
  [/^\s+/, "plain"],
  [/^[^\w\s]/, "operator"],
];

export function tokenizeCpp(code: string): CodeToken[][] {
  return code.split("\n").map((line) => {
    const tokens: CodeToken[] = [];
    let rest = line;

    while (rest) {
      for (const [pattern, kind] of rules) {
        const match = rest.match(pattern);
        if (match) {
          tokens.push({ text: match[0], kind });
          rest = rest.slice(match[0].length);
          break;
        }
      }
    }
    return tokens;
  });
}

export const tokenClassNames: Record<TokenKind, string> = {
  keyword: "text-brand-300",
  type: "text-sky-300",
  string: "text-amber-200",
  number: "text-emerald-300",
  comment: "text-slate-500 italic",
  preproc: "text-slate-400",
  function: "text-sky-200",
  operator: "text-slate-400",
  plain: "text-slate-200",
};
