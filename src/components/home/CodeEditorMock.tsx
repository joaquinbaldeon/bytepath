"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";

const code = `#include <bits/stdc++.h>
using namespace std;

int main() {
  int n, q;
  cin >> n >> q;
  vector<long long> pre(n + 1);
  for (int i = 1; i <= n; i++) {
    cin >> pre[i];
    pre[i] += pre[i - 1];
  }
  while (q--) {
    int l, r;
    cin >> l >> r;
    cout << pre[r] - pre[l - 1] << '\\n';
  }
}`;

type Token = { text: string; className: string };

// Resaltado mínimo, suficiente para este fragmento. El orden de las reglas importa.
const rules: [RegExp, string][] = [
  [/^#include.*/, "text-slate-500"],
  [/^'(?:\\.|[^'])*'/, "text-amber-200"],
  [/^(?:int|long|for|while|using|namespace)\b/, "text-brand-300"],
  [/^(?:vector|cin|cout|std|main)\b/, "text-sky-300"],
  [/^\d+/, "text-emerald-300"],
  [/^[A-Za-z_]\w*/, "text-slate-200"],
  [/^\s+/, ""],
  [/^[^\w\s]/, "text-slate-400"],
];

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;
  while (rest) {
    for (const [pattern, className] of rules) {
      const match = rest.match(pattern);
      if (match) {
        tokens.push({ text: match[0], className });
        rest = rest.slice(match[0].length);
        break;
      }
    }
  }
  return tokens;
}

const lines = code.split("\n").map(tokenize);
const total = code.length;

// Recorta el código a los primeros `visible` caracteres y marca dónde va el cursor.
function sliceCode(visible: number) {
  let budget = visible;
  let caretPlaced = false;

  return lines.map((tokens, i) => {
    const shown: Token[] = [];
    for (const token of tokens) {
      if (budget <= 0) break;
      const text = token.text.slice(0, budget);
      budget -= text.length;
      shown.push({ ...token, text });
    }

    let caret = false;
    if (!caretPlaced) {
      if (budget <= 0 || i === lines.length - 1) {
        caret = true;
        caretPlaced = true;
      } else {
        budget -= 1; // salto de línea
      }
    }
    return { tokens: shown, caret };
  });
}

export function CodeEditorMock() {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(0);

  const visible = reduceMotion ? total : typed;
  const done = visible >= total;

  useEffect(() => {
    if (reduceMotion || typed >= total) return;
    const id = window.setTimeout(
      () => setTyped((t) => Math.min(t + 3, total)),
      typed === 0 ? 900 : 28,
    );
    return () => window.clearTimeout(id);
  }, [typed, reduceMotion]);

  return (
    <div
      role="img"
      aria-label="Editor con una solución en C++ enviada y aceptada"
      className="relative mx-auto max-w-lg lg:mr-0 lg:ml-auto"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-800/90 shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="ml-3 font-mono text-xs text-slate-400">suma_rangos.cpp</span>
          </div>
          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-400">
            C++17
          </span>
        </div>

        <pre className="overflow-hidden px-3 py-4 font-mono text-[12px] leading-6 sm:px-4 sm:text-[13px]">
          <code>
            {sliceCode(visible).map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 shrink-0 pr-4 text-right text-slate-600 select-none">
                  {i + 1}
                </span>
                <span className="whitespace-pre">
                  {line.tokens.map((token, j) => (
                    <span key={j} className={token.className}>
                      {token.text}
                    </span>
                  ))}
                  {line.caret && (
                    <span className="ml-px inline-block h-4 w-0.5 translate-y-[3px] animate-caret bg-brand-300" />
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <span className="text-xs text-slate-500">Problema · Suma de rangos</span>
          <span className="rounded-md bg-brand-500 px-3 py-1 text-xs font-medium text-white">
            Enviar
          </span>
        </div>
      </div>

      {/* Progreso del curso */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -top-10 -right-3 hidden w-56 sm:block lg:-right-8"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-xl border border-white/10 bg-night-700/95 p-4 shadow-xl backdrop-blur"
        >
          <p className="font-mono text-[10px] tracking-wider text-slate-400 uppercase">
            Curso · C++ desde cero
          </p>
          <p className="mt-1 text-sm font-medium text-white">Módulo 3 · Bucles</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-learn"
              initial={{ width: 0 }}
              animate={{ width: "68%" }}
              transition={{ delay: 1.4, duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="mt-1.5 text-right font-mono text-[11px] text-slate-400">68%</p>
        </motion.div>
      </motion.div>

      {/* Veredicto: aparece cuando termina de escribirse la solución */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={done ? { opacity: 1, scale: 1, y: 0 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
        className="absolute -bottom-7 left-4 sm:-left-8"
      >
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-night-700/95 px-4 py-3 shadow-xl backdrop-blur">
          <span className="grid size-9 place-items-center rounded-lg bg-practice/15">
            <CircleCheck className="size-5 text-practice" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Aceptado</p>
            <p className="font-mono text-[11px] text-slate-400">12/12 casos · 18 ms</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
