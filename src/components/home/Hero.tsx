"use client";

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { CodeEditorMock } from "@/components/home/CodeEditorMock";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/site";

const words = [
  { text: "Aprende", dot: "text-learn" },
  { text: "Practica", dot: "text-practice" },
  { text: "Compite", dot: "text-compete" },
];

// Datos verificables de la plataforma, no estadísticas de uso.
const facts = [
  { value: "C++", label: "El lenguaje de toda la plataforma" },
  { value: "3 niveles", label: "Problemas fáciles, medios y difíciles" },
  { value: "Paso a paso", label: "Teoría, cuestionarios y ejercicios" },
];

const ease = [0.22, 1, 0.36, 1] as const;

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
  };
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-night-900 pt-32 text-white sm:pt-40">
      <div
        aria-hidden
        className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute top-24 right-[-12rem] -z-10 size-[40rem] rounded-full bg-brand-500/20 blur-[140px]"
      />

      <Container className="grid items-center gap-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <motion.p
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300"
          >
            <Terminal aria-hidden className="size-3.5 text-brand-300" />
            Programación competitiva en C++
          </motion.p>

          <h1 className="mt-7 font-display text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {words.map((word, i) => (
              <motion.span
                key={word.text}
                className="block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.18, ease }}
              >
                {word.text}
                <span className={word.dot}>.</span>{" "}
              </motion.span>
            ))}
          </h1>

          <motion.p
            {...fadeUp(0.7)}
            className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300"
          >
            BytePath te acompaña desde tu primera línea de C++ hasta tu primer
            concurso: cursos guiados, problemas para practicar y un espacio para
            competir.
          </motion.p>

          <motion.div {...fadeUp(0.85)} className="mt-9 flex flex-wrap gap-3">
            <Button href={routes.signup} size="lg" arrow>
              Comenzar ahora
            </Button>
            <Button href="/#problemas" size="lg" variant="outlineDark">
              Ver problemas
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <CodeEditorMock />
        </motion.div>
      </Container>

      <Container className="mt-24">
        <motion.dl
          {...fadeUp(1.1)}
          className="grid border-t border-white/10 sm:grid-cols-3"
        >
          {facts.map((fact) => (
            <div
              key={fact.value}
              className="border-b border-white/10 py-6 sm:border-b-0 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0"
            >
              <dt className="font-display text-xl font-semibold">{fact.value}</dt>
              <dd className="mt-1 text-sm text-slate-400">{fact.label}</dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  );
}
