import { Circle, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type Difficulty = "easy" | "medium" | "hard";

const difficultyLabel: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const problems: { title: string; topic: string; difficulty: Difficulty; solved: boolean }[] = [
  { title: "Suma de rangos", topic: "Prefijos", difficulty: "easy", solved: true },
  { title: "Subarreglo de suma máxima", topic: "DP", difficulty: "medium", solved: true },
  { title: "Caminos en una cuadrícula", topic: "DP", difficulty: "medium", solved: false },
  { title: "Islas conectadas", topic: "Grafos", difficulty: "medium", solved: false },
  { title: "Ruta más corta con peajes", topic: "Grafos", difficulty: "hard", solved: false },
];

const topics = ["Todos", "Prefijos", "DP", "Grafos", "Greedy"];

const solution = [
  <><span className="text-brand-300">long long</span> best = a[<span className="text-emerald-300">0</span>], cur = <span className="text-emerald-300">0</span>;</>,
  <><span className="text-brand-300">for</span> (<span className="text-brand-300">auto</span> x : a) {"{"}</>,
  <>  cur = <span className="text-sky-300">max</span>(x, cur + x);</>,
  <>  best = <span className="text-sky-300">max</span>(best, cur);</>,
  <>{"}"}</>,
];

export function ProblemsMock() {
  return (
    <div
      role="img"
      aria-label="Lista de problemas con dificultad y tema, y una solución en C++ aceptada"
      className="relative mx-auto max-w-md lg:max-w-none lg:pb-24"
    >
      <div aria-hidden className="absolute inset-10 -z-10 rounded-[2rem] bg-practice/15 blur-3xl" />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-24px_rgb(15_23_42/0.3)] sm:p-6 lg:ml-14">
        <div className="flex items-end justify-between">
          <p className="font-display text-lg font-semibold">Problemas</p>
          <p className="font-mono text-[11px] text-slate-400">
            <span className="text-practice-ink">2</span> / 5 resueltos
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {topics.map((topic, i) => (
            <span
              key={topic}
              className={`rounded-full px-2.5 py-1 text-xs ${
                i === 0 ? "bg-ink text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {topic}
            </span>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-slate-100">
          {problems.map((problem) => (
            <li key={problem.title} className="flex items-center gap-3 py-3">
              {problem.solved ? (
                <CircleCheck className="size-4 shrink-0 text-practice-ink" />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300" />
              )}
              <span className="flex-1 truncate text-sm font-medium">{problem.title}</span>
              <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">
                {problem.topic}
              </span>
              <Badge tone={problem.difficulty} className="w-14 justify-center">
                {difficultyLabel[problem.difficulty]}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative -mt-8 w-72 rounded-2xl lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 border border-white/10 bg-night-900 p-4 text-white shadow-[0_24px_48px_-16px_rgb(15_23_42/0.5)] sm:w-80">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-slate-400">subarreglo_maximo.cpp</span>
          <span className="rounded-full bg-compete/15 px-2 py-0.5 text-[11px] font-medium text-compete">
            Medio
          </span>
        </div>
        <pre className="mt-3 font-mono text-[12px] leading-5 text-slate-300">
          {solution.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line}
            </div>
          ))}
        </pre>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="flex items-center gap-2 text-sm font-medium text-practice">
            <CircleCheck className="size-4" />
            Aceptado
          </span>
          <span className="rounded-md bg-brand-500 px-3 py-1 text-xs font-medium">Enviar</span>
        </div>
      </div>
    </div>
  );
}
