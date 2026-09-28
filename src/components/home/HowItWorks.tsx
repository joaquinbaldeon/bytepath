"use client";

import { motion } from "framer-motion";
import { BookOpen, ChartNoAxesColumn, CodeXml, Trophy } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";

const steps = [
  {
    icon: BookOpen,
    title: "Aprende la teoría",
    text: "Completa lecciones y cuestionarios para dominar cada concepto.",
    accent: "bg-learn/10 text-learn-ink",
  },
  {
    icon: CodeXml,
    title: "Practica con código real",
    text: "Resuelve los desafíos de cada lección: tu C++ se compila y se prueba de verdad.",
    accent: "bg-practice/10 text-practice-ink",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Mide tu progreso",
    text: "Sigue tu camino: lecciones completadas, energía y tokens.",
    accent: "bg-brand-500/10 text-brand-600",
  },
  {
    icon: Trophy,
    title: "Compite",
    text: "Pon a prueba lo aprendido en concursos. Muy pronto.",
    accent: "bg-compete/10 text-compete-ink",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-paper py-24 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-brand-600 uppercase">
            Cómo funciona
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Tu ruta en BytePath
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* Línea de la ruta: horizontal en escritorio, vertical en móvil */}
          <div aria-hidden className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-slate-200 lg:block">
            <motion.div
              className="h-full origin-left bg-brand-500/60"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </div>
          <div aria-hidden className="absolute top-6 bottom-6 left-6 w-px bg-slate-200 lg:hidden" />

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Reveal
                  delay={i * 0.15}
                  className="flex gap-5 lg:flex-col lg:items-center lg:text-center"
                >
                  <span
                    className={`relative grid size-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white`}
                  >
                    <span className={`grid size-9 place-items-center rounded-full ${step.accent}`}>
                      <step.icon aria-hidden className="size-4" />
                    </span>
                  </span>
                  <div>
                    <p className="font-mono text-xs text-slate-400">Paso {i + 1}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600 lg:mx-auto lg:max-w-56">
                      {step.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
