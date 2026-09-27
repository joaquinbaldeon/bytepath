"use client";

import { BookOpen, Code2, Flag, Lock, Play, Zap } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { PathLesson, PathModule } from "@/lib/courses/path";
import { useLiveAccount } from "@/lib/energy/store";
import { useCountdown } from "@/lib/energy/useCountdown";
import type { AccountState } from "@/lib/energy/types";
import { routes } from "@/lib/site";

/**
 * El camino de aprendizaje de un curso.
 *
 * NO va dentro de un panel: se apoya directamente en el fondo de la página, sin
 * caja, sin borde y sin relleno propio. Lo único que lo acompaña es la cuadrícula
 * de puntos ultra tenue del fondo de la sección (`bp-page-grid`).
 *
 * La identidad es la de un problema de concurso más que la de una lista con
 * círculos: el camino es una TRAZA —como la de un circuito o la de un grafo—
 * que baja por la izquierda con quiebros a 45°, y cada lección es un nodo de esa
 * traza. Cada sector (módulo) abre con una cabecera tipo HUD (sector, aciertos,
 * duración) y lo completado se marca como lo marca un juez: `AC`.
 *
 * Los nodos no son todos el mismo botón. Su FORMA dice qué es:
 *   · cuadrado con pines   →  teoría (un chip en el bus)
 *   · octógono             →  lección con desafío de código (esquinas cortadas
 *                             a 45°, el mismo ángulo que la traza)
 *   · rombo doble          →  checkpoint: el repaso que cierra un sector
 * y su TAMAÑO y RELLENO dicen en qué estado está: la siguiente es la más grande
 * y pulsa; la completada es sólida con `AC`; la bloqueada es pequeña, hueca y
 * discontinua; la que espera energía es ámbar.
 *
 * Este componente solo PINTA. El estado de cada nodo (completada, en curso,
 * disponible, bloqueada por progreso) llega ya decidido por el servidor a partir
 * del progreso persistido. Lo único que se resuelve aquí es lo que cambia solo
 * con el reloj: si una lección lista para completar está esperando ENERGÍA.
 *
 * "Bloqueada por progreso" y "esperando energía" son cosas distintas y se ven
 * distintas: la primera dice "completa X antes" (cerrojo, hueca) y la segunda
 * "necesitas 1 ⚡ para completar" (rayo ámbar, con la cuenta atrás). La energía
 * nunca impide ABRIR una lección: solo el último paso, completarla.
 */

/* --------------------------------- Geometría -------------------------------- */
/* Todo en píxeles reales: la traza y los nodos comparten un sistema de           */
/* coordenadas, así que los quiebros son de 45° de verdad y no se deforman.        */

const ROW = 92;
const HEAD = 136;
const RAIL = 88;
const CX = 44;
const JOG = 20;

/** Desplazamiento lateral del nodo `i` de un sector de `n`: entra y sale recto, y en medio serpentea. */
function offsetOf(index: number, count: number): number {
  if (index === 0 || index === count - 1) return 0;
  return [JOG, 0, -JOG, 0][(index - 1) % 4];
}

const nodeY = (index: number) => HEAD + index * ROW + ROW / 2;

/** Traza con quiebro a 45° entre dos nodos: recto, diagonal, recto. */
function link(x0: number, y0: number, x1: number, y1: number): string {
  const dx = Math.abs(x1 - x0);
  if (dx === 0) return `M ${x0} ${y0} L ${x1} ${y1}`;
  const a = (y1 - y0 - dx) / 2;
  return `M ${x0} ${y0} L ${x0} ${y0 + a} L ${x1} ${y0 + a + dx} L ${x1} ${y1}`;
}

type Tone = "done" | "active" | "todo";

function toneBetween(previous: PathLesson, next: PathLesson): Tone {
  if (previous.state === "completed" && next.state === "completed") return "done";
  if (previous.state === "completed" && next.isCurrent) return "active";
  return "todo";
}

/* ---------------------------------- Estados --------------------------------- */

type Visual = "done" | "next" | "progress" | "energy" | "open" | "locked";

type Context = {
  needsLogin: boolean;
  /** Cuenta Free sin energía: una lección lista para completar tiene que esperar. */
  outOfEnergy: boolean;
  isPremium: boolean;
  countdown: string | null;
};

function visualOf(lesson: PathLesson, context: Context): Visual {
  switch (lesson.state) {
    case "completed":
      return "done";
    case "locked":
      return "locked";
    case "in_progress":
      return lesson.ready && context.outOfEnergy ? "energy" : "progress";
    case "available":
      return lesson.isCurrent ? "next" : "open";
  }
}

const shapeOf = (lesson: PathLesson) =>
  lesson.kind === "quiz" ? "checkpoint" : lesson.hasChallenge ? "octagon" : "chip";

/** Lado del nodo en px. La siguiente es la protagonista; lo bloqueado se retira. */
const nodeSize: Record<Visual, number> = {
  next: 64,
  progress: 58,
  energy: 54,
  open: 50,
  done: 46,
  locked: 36,
};

const shapeStyle: Record<Visual, string> = {
  done: "fill-practice/15 stroke-practice",
  next: "fill-brand-500 stroke-brand-400",
  progress: "fill-brand-500/15 stroke-brand-500",
  energy: "fill-energy/15 stroke-energy [stroke-dasharray:4_3]",
  open: "fill-surface stroke-fg-subtle",
  locked: "fill-transparent stroke-line [stroke-dasharray:3_4]",
};

/** Dibujo de cada forma en una caja de 56×56: pines, esquinas cortadas, doble rombo. */
function Shape({ shape, visual }: { shape: "chip" | "octagon" | "checkpoint"; visual: Visual }) {
  const common = `${shapeStyle[visual]} stroke-[2]`;

  return (
    <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 size-full overflow-visible">
      {shape === "chip" && (
        <>
          <rect x="9" y="9" width="38" height="38" rx="8" className={common} />
          <path
            d="M2 22h7M2 34h7M47 22h7M47 34h7"
            className="fill-none stroke-current opacity-45"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {shape === "octagon" && (
        <path d="M19 5H37L51 19V37L37 51H19L5 37V19Z" strokeLinejoin="round" className={common} />
      )}
      {shape === "checkpoint" && (
        <>
          <path d="M28 2 54 28 28 54 2 28Z" strokeLinejoin="round" className={common} />
          <path
            d="M28 12 44 28 28 44 12 28Z"
            strokeLinejoin="round"
            className="fill-none stroke-current opacity-40"
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  );
}

function Glyph({ lesson, visual }: { lesson: PathLesson; visual: Visual }) {
  const icon = "size-[42%]";
  switch (visual) {
    case "done":
      return lesson.kind === "quiz" ? (
        <Flag aria-hidden className={`${icon} text-practice-ink`} />
      ) : (
        <span className="font-mono text-[11px] leading-none font-bold tracking-tight text-practice-ink">
          AC
        </span>
      );
    case "next":
      return <Play aria-hidden className={`${icon} fill-white text-white`} />;
    case "progress":
      return <Play aria-hidden className={`${icon} fill-current text-brand-ink`} />;
    case "energy":
      return <Zap aria-hidden className={`${icon} fill-current text-energy-ink`} />;
    case "locked":
      return <Lock aria-hidden className="size-[40%] text-fg-subtle" />;
    case "open":
      return lesson.kind === "quiz" ? (
        <Flag aria-hidden className={`${icon} text-fg`} />
      ) : lesson.hasChallenge ? (
        <Code2 aria-hidden className={`${icon} text-fg`} />
      ) : (
        <BookOpen aria-hidden className={`${icon} text-fg`} />
      );
  }
}

/** Ese "mira aquí": el anillo que pulsa y las seis chispas de la llegada. */
function Beacon({ tone }: { tone: "brand" | "energy" }) {
  return (
    <>
      <span
        aria-hidden
        className={`absolute -inset-1.5 rounded-full ${
          tone === "energy" ? "bp-node-pulse-energy" : "bp-node-pulse"
        }`}
      />
      {tone === "brand" &&
        Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="bp-burst absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-brand-400"
            style={{ "--a": `${i * 60 + 20}deg` } as CSSProperties}
          />
        ))}
    </>
  );
}

const kindLabels = { theory: "Teoría", exercise: "Ejercicio", quiz: "Checkpoint" } as const;

/** Segmentos del quiz: seis marcas, llenas las acertadas. Es el "3/6" hecho forma. */
function QuizTicks({ solved, total }: { solved: number; total: number }) {
  return (
    <span aria-hidden className="inline-flex items-center gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-[3px] w-3 rounded-full ${i < solved ? "bg-brand-500" : "bg-line"}`}
        />
      ))}
    </span>
  );
}

function describe(
  lesson: PathLesson,
  visual: Visual,
  context: Context,
): { chip: string; chipClass: string; detail: ReactNode; detailClass: string } {
  switch (visual) {
    case "done":
      return {
        chip: "AC",
        chipClass: "bg-practice/15 text-practice-ink",
        detail: "Completada · repasar",
        detailClass: "text-practice-ink",
      };

    case "locked":
      return {
        chip: "Bloqueada",
        chipClass: "bg-surface-2 text-fg-subtle",
        detail: `Completa «${lesson.lockedBy ?? "la lección anterior"}» para abrirla`,
        detailClass: "text-fg-subtle",
      };

    case "energy":
      return {
        chip: "Esperando ⚡",
        chipClass: "bg-energy/20 text-energy-ink",
        detail: (
          <>
            Necesitas 1 ⚡ para completarla
            {context.countdown && <> · próxima energía en {context.countdown}</>}
          </>
        ),
        detailClass: "text-energy-ink",
      };

    case "progress": {
      const quizRunning = lesson.quizStatus === "in_progress" && lesson.quizTotal > 0;
      return {
        chip: "En curso",
        chipClass: "bg-brand-500/15 text-brand-ink",
        detail: quizRunning ? (
          <span className="inline-flex items-center gap-2">
            Quiz {lesson.quizSolved}/{lesson.quizTotal}
            <QuizTicks solved={lesson.quizSolved} total={lesson.quizTotal} />
          </span>
        ) : lesson.ready ? (
          context.isPremium ? (
            "Todo listo · solo falta completarla"
          ) : (
            "Todo listo · completarla cuesta 1 ⚡"
          )
        ) : lesson.quizStatus === "completed" && lesson.hasChallenge ? (
          "Quiz superado · falta el desafío"
        ) : (
          "Empezada · continuar"
        ),
        detailClass: "text-brand-ink",
      };
    }

    case "next":
      return {
        chip: "Siguiente",
        chipClass: "bg-brand-500 text-white",
        detail: context.needsLogin
          ? "Inicia sesión para guardar tu progreso"
          : context.isPremium
            ? "Entrar es gratis · Premium no gasta energía"
            : "Entrar es gratis · completarla cuesta 1 ⚡",
        detailClass: "text-brand-ink",
      };

    case "open":
      return {
        chip: "Disponible",
        chipClass: "bg-surface-2 text-fg-muted",
        detail: "Entrar es gratis",
        detailClass: "text-fg-muted",
      };
  }
}

const stateText: Record<Visual, string> = {
  done: "Completada.",
  next: "Siguiente lección.",
  progress: "En curso.",
  energy: "En curso, esperando energía para completarla.",
  open: "Disponible.",
  locked: "Bloqueada.",
};

function Node({ lesson, visual, x }: { lesson: PathLesson; visual: Visual; x: number }) {
  const size = nodeSize[visual] + (lesson.kind === "quiz" ? 6 : 0);
  const shape = shapeOf(lesson);

  return (
    <span
      aria-hidden
      className="bp-node-in absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, width: size, height: size }}
    >
      {visual === "next" && <Beacon tone="brand" />}
      {visual === "energy" && <Beacon tone="energy" />}
      <span className="absolute inset-0 text-fg-subtle">
        <Shape shape={shape} visual={visual} />
      </span>
      <span className="absolute inset-0 grid place-items-center">
        <Glyph lesson={lesson} visual={visual} />
      </span>
    </span>
  );
}

function Row({
  lesson,
  index,
  count,
  moduleNumber,
  context,
}: {
  lesson: PathLesson;
  index: number;
  count: number;
  moduleNumber: number;
  context: Context;
}) {
  const visual = visualOf(lesson, context);
  const { chip, chipClass, detail, detailClass } = describe(lesson, visual, context);
  const interactive = visual !== "locked";
  const href = context.needsLogin && visual === "next" ? routes.login : lesson.href;
  const locked = visual === "locked";

  const body = (
    <>
      <span className="sr-only">{stateText[visual]}</span>
      <Node lesson={lesson} visual={visual} x={CX + offsetOf(index, count)} />

      <span
        className="absolute inset-y-0 right-3 flex items-center gap-4 sm:right-4"
        style={{ left: RAIL + 6 }}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] tracking-[0.12em] text-fg-subtle uppercase">
            <span className={`rounded px-1.5 py-[2px] font-semibold ${chipClass}`}>{chip}</span>
            <span>
              {kindLabels[lesson.kind]}
              {lesson.hasChallenge && lesson.kind !== "quiz" && (
                <span className="text-compete-ink"> · Desafío</span>
              )}
            </span>
          </span>
          <span
            className={`line-clamp-2 leading-snug ${
              locked
                ? "text-dense text-fg-muted"
                : visual === "next"
                  ? "text-base font-semibold text-fg sm:text-lg"
                  : "text-body font-medium text-fg"
            }`}
          >
            {lesson.title}
          </span>
          <span className={`text-label leading-4 ${detailClass}`}>{detail}</span>
        </span>

        {/* Coordenada del nodo (sector · nodo) y duración: dato de HUD, solo donde cabe. */}
        <span className="hidden shrink-0 flex-col items-end gap-0.5 font-mono text-[10.5px] tracking-wider text-fg-subtle tabular-nums sm:flex">
          <span>
            {String(moduleNumber).padStart(2, "0")}.{String(index + 1).padStart(2, "0")}
          </span>
          <span>{lesson.minutes} min</span>
        </span>
      </span>
    </>
  );

  const rowClass =
    "absolute inset-x-0 rounded-xl transition-colors " +
    (interactive
      ? "focus-ring-tight hover:bg-fg/[0.035]"
      : "cursor-default");

  return (
    <li className="absolute inset-x-0" style={{ top: HEAD + index * ROW, height: ROW }}>
      {interactive ? (
        <Link href={href} className={`${rowClass} inset-y-0`}>
          {body}
        </Link>
      ) : (
        <div aria-disabled="true" className={`${rowClass} inset-y-0`}>
          {body}
        </div>
      )}
    </li>
  );
}

/* ------------------------------- Traza (bus) ------------------------------- */

const strokeByTone: Record<Tone, string> = {
  done: "stroke-practice",
  active: "stroke-brand-500",
  todo: "stroke-line",
};

function Trace({
  module,
  lead,
  tail,
}: {
  module: PathModule;
  /** Tono del tramo que entra al sector (desde el nodo anterior o desde arriba). */
  lead: Tone;
  /** Tono del tramo que sale hacia el siguiente sector; `null` en el último. */
  tail: Tone | null;
}) {
  const count = module.lessons.length;
  const total = HEAD + count * ROW;

  const segments: { d: string; tone: Tone }[] = [];
  segments.push({ d: `M ${CX} 0 L ${CX} ${nodeY(0)}`, tone: lead });

  for (let i = 1; i < count; i++) {
    segments.push({
      d: link(CX + offsetOf(i - 1, count), nodeY(i - 1), CX + offsetOf(i, count), nodeY(i)),
      tone: toneBetween(module.lessons[i - 1], module.lessons[i]),
    });
  }
  if (tail) {
    segments.push({ d: `M ${CX} ${nodeY(count - 1)} L ${CX} ${total}`, tone: tail });
  }

  const active = segments.find((segment) => segment.tone === "active");

  return (
    <>
      <svg
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 overflow-visible"
        width={RAIL}
        height={total}
        viewBox={`0 0 ${RAIL} ${total}`}
      >
        {segments.map((segment, i) =>
          segment.tone === "done" ? (
            <g key={i}>
              <path d={segment.d} className="fill-none stroke-practice/20" strokeWidth="7" strokeLinecap="round" />
              <path
                d={segment.d}
                pathLength={1}
                className={`bp-trace-draw fill-none ${strokeByTone.done}`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ) : (
            <path
              key={i}
              d={segment.d}
              className={`fill-none ${strokeByTone[segment.tone]} ${
                segment.tone === "active" ? "bp-path-flow" : ""
              }`}
              strokeWidth={segment.tone === "active" ? 2.5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={segment.tone === "active" ? "6 6" : "1 7"}
            />
          ),
        )}

        {/* Vía: el punto donde la traza cruza la cabecera del sector. */}
        <circle
          cx={CX}
          cy={HEAD * 0.34}
          r="4.5"
          className={`fill-canvas ${strokeByTone[lead]}`}
          strokeWidth="2"
        />
      </svg>

      {/* Señal que viaja por el tramo activo, del nodo hecho al que toca. */}
      {active && (
        <span
          aria-hidden
          className="bp-signal absolute top-0 left-0 size-[7px] rounded-full bg-brand-400 shadow-[0_0_10px_2px_rgb(141_129_248_/_0.7)]"
          style={{ offsetPath: `path("${active.d}")`, offsetRotate: "0deg" }}
        />
      )}
    </>
  );
}

/* ------------------------------ Cabecera de sector ------------------------------ */

function SectorHeader({ module }: { module: PathModule }) {
  const done = module.completed === module.total;

  return (
    <div
      className="absolute inset-x-0 top-0 flex flex-col justify-center pr-3 sm:pr-4"
      style={{ height: HEAD, paddingLeft: RAIL + 6 }}
    >
      <div className="flex items-center gap-3 font-mono text-[10.5px] tracking-[0.18em] uppercase">
        <span className="font-semibold text-fg-muted">
          Sector {String(module.number).padStart(2, "0")}
        </span>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className={`tabular-nums ${done ? "font-semibold text-practice-ink" : "text-fg-subtle"}`}>
          {done ? "Superado" : `${String(module.completed).padStart(2, "0")}/${String(module.total).padStart(2, "0")} AC`}
        </span>
      </div>

      <h3 className="mt-1.5 font-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
        {module.title}
      </h3>
      {module.summary && (
        <p className="mt-1 line-clamp-2 max-w-xl text-dense leading-5 text-fg-muted">{module.summary}</p>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] tracking-wider text-fg-subtle uppercase">
        <span
          role="img"
          aria-label={`${module.completed} de ${module.total} lecciones completadas`}
          className="inline-flex items-center gap-[3px]"
        >
          {module.lessons.map((lesson) => (
            <span
              key={lesson.slug}
              className={`h-1 w-3.5 rounded-full ${
                lesson.state === "completed"
                  ? "bg-practice"
                  : lesson.state === "in_progress"
                    ? "bg-brand-500"
                    : "bg-line"
              }`}
            />
          ))}
        </span>
        <span className="tabular-nums">{module.minutes} min</span>
        {module.challenges > 0 && (
          <span className="text-compete-ink tabular-nums">
            {module.challenges} {module.challenges === 1 ? "desafío" : "desafíos"}
          </span>
        )}
      </p>
    </div>
  );
}

/* ---------------------------------- Camino ---------------------------------- */

export function LearningPath({
  modules,
  account,
}: {
  modules: PathModule[];
  /** Estado de la cuenta tal como lo resolvió el servidor; se refresca solo con el almacén vivo. */
  account: AccountState;
}) {
  const live = useLiveAccount(account);
  const countdown = useCountdown(live.isPremium ? null : live.nextEnergyAt);

  const context: Context = {
    needsLogin: live.metered && !live.signedIn,
    outOfEnergy:
      live.metered && live.signedIn && !live.isPremium && (live.remaining ?? 1) <= 0,
    isPremium: live.isPremium,
    countdown,
  };

  return (
    <ol className="max-w-[46rem]">
      {modules.map((module, moduleIndex) => {
        const previousModule = moduleIndex > 0 ? modules[moduleIndex - 1] : null;
        const nextModule = moduleIndex < modules.length - 1 ? modules[moduleIndex + 1] : null;
        const first = module.lessons[0];
        const last = module.lessons[module.lessons.length - 1];
        const previousLast = previousModule?.lessons[previousModule.lessons.length - 1];

        const lead: Tone = previousLast
          ? toneBetween(previousLast, first)
          : first.state === "completed"
            ? "done"
            : first.isCurrent
              ? "active"
              : "todo";
        const tail: Tone | null = nextModule ? toneBetween(last, nextModule.lessons[0]) : null;

        return (
          <li
            key={module.slug}
            className="relative"
            style={{ height: HEAD + module.lessons.length * ROW }}
          >
            <Trace module={module} lead={lead} tail={tail} />
            <SectorHeader module={module} />
            <ol>
              {module.lessons.map((lesson, lessonIndex) => (
                <Row
                  key={lesson.slug}
                  lesson={lesson}
                  index={lessonIndex}
                  count={module.lessons.length}
                  moduleNumber={module.number}
                  context={context}
                />
              ))}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
