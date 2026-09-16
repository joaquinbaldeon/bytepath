"use client";

import { motion } from "framer-motion";
import { CircleCheck, Lock } from "lucide-react";

type Status = "done" | "current" | "locked";

const modules: { title: string; lessons: string; status: Status }[] = [
  { title: "Primeros pasos", lessons: "5/5", status: "done" },
  { title: "Variables y tipos", lessons: "6/6", status: "done" },
  { title: "Condicionales y bucles", lessons: "3/6", status: "current" },
  { title: "Vectores y cadenas", lessons: "0/7", status: "locked" },
];

const lessons: { kind: string; title: string; status: Status }[] = [
  { kind: "Teoría", title: "El bucle for", status: "done" },
  { kind: "Cuestionario", title: "Contar iteraciones", status: "done" },
  { kind: "Ejercicio", title: "Suma de números pares", status: "current" },
];

function StatusIcon({ status }: { status: Status }) {
  if (status === "done") return <CircleCheck className="size-4 shrink-0 text-learn-ink" />;
  if (status === "locked") return <Lock className="size-4 shrink-0 text-slate-300" />;
  return (
    <span className="grid size-4 shrink-0 place-items-center rounded-full border-2 border-learn">
      <span className="size-1.5 rounded-full bg-learn" />
    </span>
  );
}

export function CourseMock() {
  return (
    <div
      role="img"
      aria-label="Vista de un curso con módulos, lecciones, progreso y un cuestionario"
      className="relative mx-auto max-w-md lg:max-w-none lg:pb-20"
    >
      <div aria-hidden className="absolute inset-10 -z-10 rounded-[2rem] bg-learn/20 blur-3xl" />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-24px_rgb(15_23_42/0.3)] sm:p-6 lg:mr-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-slate-400 uppercase">Curso</p>
            <p className="mt-1 font-display text-lg font-semibold">C++ desde cero</p>
          </div>
          <span className="font-mono text-sm font-medium text-learn-ink">42%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-learn"
            initial={{ width: 0 }}
            whileInView={{ width: "42%" }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
          />
        </div>

        <ul className="mt-5 space-y-2">
          {modules.map((module, i) => (
            <li
              key={module.title}
              className={`rounded-xl border px-3.5 py-3 ${
                module.status === "current" ? "border-learn/40 bg-learn/5" : "border-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={module.status} />
                <span
                  className={`flex-1 text-sm font-medium ${
                    module.status === "locked" ? "text-slate-400" : "text-ink"
                  }`}
                >
                  Módulo {i + 1} · {module.title}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{module.lessons}</span>
              </div>

              {module.status === "current" && (
                <ul className="mt-3 ml-2 space-y-2 border-l border-learn/30 pl-4">
                  {lessons.map((lesson) => (
                    <li key={lesson.title} className="flex items-center gap-2.5 text-[13px]">
                      <StatusIcon status={lesson.status} />
                      <span className="hidden w-20 font-mono text-[11px] text-slate-400 sm:inline">
                        {lesson.kind}
                      </span>
                      <span
                        className={
                          lesson.status === "current" ? "font-medium text-ink" : "text-slate-500"
                        }
                      >
                        {lesson.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative -mt-8 ml-auto w-64 rounded-2xl lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 border border-slate-200 bg-white p-4 shadow-[0_24px_48px_-16px_rgb(15_23_42/0.35)] sm:w-72">
        <p className="font-mono text-[11px] text-slate-400">Cuestionario · 2 de 5</p>
        <p className="mt-2 text-sm font-medium">¿Cuántas veces se ejecuta el bucle?</p>
        <pre className="mt-2.5 rounded-lg bg-night-900 px-3 py-2 font-mono text-[12px] text-slate-200">
          <span className="text-brand-300">for</span> (<span className="text-brand-300">int</span> i ={" "}
          <span className="text-emerald-300">0</span>; i &lt; <span className="text-emerald-300">3</span>; i++)
        </pre>
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-sm">
          {["2", "3", "4"].map((option) => (
            <span
              key={option}
              className={`rounded-lg border py-1.5 text-center ${
                option === "3"
                  ? "border-learn/50 bg-learn/10 font-semibold text-learn-ink"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {option}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
