import { Check, Timer } from "lucide-react";

type Result = { status: "ok" | "tried" | "none"; attempts?: number };

// Datos ilustrativos de una vista previa: no representan usuarios reales.
const rows: { rank: number; user: string; you?: boolean; results: Result[]; score: number }[] = [
  {
    rank: 1,
    user: "ana_dp",
    results: [{ status: "ok" }, { status: "ok" }, { status: "ok" }, { status: "tried", attempts: 2 }],
    score: 3,
  },
  {
    rank: 2,
    user: "bitwise",
    results: [{ status: "ok" }, { status: "ok" }, { status: "tried", attempts: 1 }, { status: "none" }],
    score: 2,
  },
  {
    rank: 3,
    user: "Tú",
    you: true,
    results: [{ status: "ok" }, { status: "ok" }, { status: "none" }, { status: "none" }],
    score: 2,
  },
  {
    rank: 4,
    user: "greedy_go",
    results: [{ status: "ok" }, { status: "tried", attempts: 3 }, { status: "none" }, { status: "none" }],
    score: 1,
  },
];

const columns = ["A", "B", "C", "D"];

function ResultCell({ result }: { result: Result }) {
  if (result.status === "ok") {
    return (
      <span className="mx-auto grid size-6 place-items-center rounded-md bg-practice/10 text-practice-ink">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (result.status === "tried") {
    return (
      <span className="mx-auto grid size-6 place-items-center rounded-md bg-hard/10 font-mono text-[11px] text-red-700">
        −{result.attempts}
      </span>
    );
  }
  return <span className="mx-auto block size-6 text-center text-slate-300">·</span>;
}

export function LeaderboardMock() {
  return (
    <div
      role="img"
      aria-label="Vista previa de la clasificación de un concurso con cuenta atrás"
      className="relative mx-auto max-w-md lg:max-w-none"
    >
      <div aria-hidden className="absolute inset-10 -z-10 rounded-[2rem] bg-compete/15 blur-3xl" />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_-24px_rgb(15_23_42/0.3)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-slate-400 uppercase">
              Vista previa
            </p>
            <p className="mt-1 font-display text-lg font-semibold">Concurso de práctica</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-night-900 px-3 py-1.5 font-mono text-sm text-white">
            <Timer className="size-4 text-compete" />
            01:24:37
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[2rem_1fr_repeat(4,2rem)_2.5rem] items-center gap-1 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-400 sm:grid-cols-[2.5rem_1fr_repeat(4,2.5rem)_3rem]">
            <span>#</span>
            <span>Participante</span>
            {columns.map((column) => (
              <span key={column} className="text-center">
                {column}
              </span>
            ))}
            <span className="text-right">Pts</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.user}
              className={`grid grid-cols-[2rem_1fr_repeat(4,2rem)_2.5rem] items-center gap-1 border-t px-3 py-2.5 text-sm sm:grid-cols-[2.5rem_1fr_repeat(4,2.5rem)_3rem] ${
                row.you ? "border-compete/30 bg-compete/5" : "border-slate-100"
              }`}
            >
              <span className="font-mono text-slate-400">{row.rank}</span>
              <span className={`truncate ${row.you ? "font-semibold text-compete-ink" : "font-medium"}`}>
                {row.user}
              </span>
              {row.results.map((result, i) => (
                <ResultCell key={i} result={result} />
              ))}
              <span className="text-right font-mono font-medium">{row.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
