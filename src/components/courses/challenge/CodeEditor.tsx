"use client";

import { cpp } from "@codemirror/lang-cpp";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import dynamic from "next/dynamic";
import { useMemo } from "react";

// CodeMirror necesita DOM: se carga solo en el cliente.
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => <div className="h-full min-h-56 animate-pulse bg-code" />,
});

// Los mismos colores que el resaltado estático de los bloques de teoría, para
// que el editor y los ejemplos se lean igual. Oscuro en ambos temas, como el
// resto del código de BytePath.
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#b9b1fb" },
  { tag: [tags.typeName, tags.standard(tags.typeName)], color: "#7dd3fc" },
  { tag: [tags.string, tags.special(tags.string), tags.character], color: "#fde68a" },
  { tag: tags.number, color: "#6ee7b7" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "#64748b", fontStyle: "italic" },
  { tag: [tags.processingInstruction, tags.meta], color: "#94a3b8" },
  { tag: tags.function(tags.variableName), color: "#bae6fd" },
  { tag: tags.operator, color: "#94a3b8" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-code)",
      color: "#e2e8f0",
      fontSize: "13px",
      height: "100%",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
    ".cm-content": { padding: "12px 0" },
    ".cm-gutters": {
      backgroundColor: "var(--color-code)",
      color: "#475569",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "rgb(255 255 255 / 0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#94a3b8" },
    ".cm-cursor": { borderLeftColor: "#b9b1fb" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgb(109 94 246 / 0.3)",
    },
  },
  { dark: true },
);

export function CodeEditor({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const extensions = useMemo(
    () => [cpp(), syntaxHighlighting(highlightStyle), editorTheme, EditorView.lineWrapping],
    [],
  );

  return (
    <div className={`overflow-hidden bg-code ${className}`}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme="none"
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          autocompletion: false,
          highlightActiveLine: true,
          bracketMatching: true,
        }}
      />
    </div>
  );
}
