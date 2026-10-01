"use client";

import { BookOpen, Code2, Flag, Lock, Play, Zap } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { curve, layoutPath, type LaidPoint, PATH_METRICS } from "@/lib/courses/pathLayout";
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
 * Es UN solo camino continuo que serpentea de arriba abajo: empieza en la
 * cabecera del primer módulo, pasa por cada lección y por la cabecera de cada
 * módulo siguiente (que es un empalme del mismo camino), y llega a la última.
 * DÓNDE está cada punto lo decide `lib/courses/pathLayout.ts` a partir de la
 * estructura del curso (un paseo con semilla: estable, sin fórmula a la vista,
 * válido para cualquier número de lecciones). Cuánto serpentea según el ancho lo
 * decide el CSS (`.bp-route*` en globals.css), no este componente.
 *
 * La identidad sigue siendo la de un problema de concurso: lo completado se
 * marca como lo marca un juez, `AC`, y los nodos tienen FORMA según qué son:
 *   · cuadrado con pines   →  teoría (un chip en el bus)
 *   · octógono             →  lección con desafío de código
 *   · rombo doble          →  checkpoint: el repaso que cierra un módulo
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

const { head: HEAD, row: ROW, junctionY: JUNCTION_Y } = PATH_METRICS;

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

/**
 * Dibujo de cada forma en una caja de 56×56: pines, esquinas cortadas, doble
 * rombo. Detrás de cada una va una PLACA del color del fondo con su mismo
 * contorno: el camino pasa por debajo y termina en el nodo en vez de verse a
 * través de los nodos huecos (el bloqueado, el disponible), que es lo que hace
 * que el nodo parezca parte del camino y no un icono puesto encima.
 */
function Shape({ shape, visual }: { shape: "chip" | "octagon" | "checkpoint"; visual: Visual }) {
  const common = `${shapeStyle[visual]} stroke-[2]`;
  const plate = "fill-canvas stroke-none";

  return (
    <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 size-full overflow-visible">
      {shape === "chip" && (
        <>
          <rect x="9" y="9" width="38" height="38" rx="8" className={plate} />
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
        <>
          <path d="M19 5H37L51 19V37L37 51H19L5 37V19Z" className={plate} />
          <path d="M19 5H37L51 19V37L37 51H19L5 37V19Z" strokeLinejoin="round" className={common} />
        </>
      )}
      {shape === "checkpoint" && (
        <>
          <path d="M28 2 54 28 28 54 2 28Z" className={plate} />
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

/* ------------------------------ Nodos y lecciones ---------------------------- */

/** Variable `--o` de un punto: lo único que el CSS necesita para colocarlo. */
const offsetVar = (point: LaidPoint) => ({ "--o": point.o }) as CSSProperties;

function Node({ lesson, visual, point }: { lesson: PathLesson; visual: Visual; point: LaidPoint }) {
  const size = nodeSize[visual] + (lesson.kind === "quiz" ? 6 : 0);
  const shape = shapeOf(lesson);

  return (
    <span
      aria-hidden
      className="bp-node bp-node-in absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ ...offsetVar(point), width: size, height: size }}
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
  point,
  context,
}: {
  lesson: PathLesson;
  index: number;
  point: LaidPoint;
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
      <Node lesson={lesson} visual={visual} point={point} />

      <span className="bp-label inset-y-0" data-side={point.side} style={offsetVar(point)}>
        <span className="flex min-w-0 max-w-[24rem] flex-col gap-[3px]">
          <span className="bp-label-row flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10.5px] tracking-[0.12em] text-fg-subtle uppercase">
            <span className={`rounded px-1.5 py-[2px] font-semibold ${chipClass}`}>{chip}</span>
            <span>
              {kindLabels[lesson.kind]}
              {lesson.hasChallenge && lesson.kind !== "quiz" && (
                <span className="text-compete-ink"> · Desafío</span>
              )}
              {lesson.inPreparation && <span className="text-fg-muted"> · En preparación</span>}
              {/* Los minutos solo caben cuando hay ancho: en móvil partirían la fila. */}
              <span className="hidden text-fg-subtle tabular-nums @2xl:inline"> · {lesson.minutes} min</span>
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
          <span className={`line-clamp-1 text-label leading-4 @lg:line-clamp-2 ${detailClass}`}>{detail}</span>
        </span>
      </span>
    </>
  );

  const rowClass =
    "absolute inset-0 rounded-xl transition-colors " +
    (interactive ? "focus-ring-tight hover:bg-fg/[0.035]" : "cursor-default");

  return (
    <li className="absolute inset-x-0" style={{ top: HEAD + index * ROW, height: ROW }}>
      {interactive ? (
        <Link href={href} className={rowClass}>
          {body}
        </Link>
      ) : (
        <div aria-disabled="true" className={rowClass}>
          {body}
        </div>
      )}
    </li>
  );
}

/* ------------------------------- Traza (camino) ------------------------------ */

const strokeByTone: Record<Tone, string> = {
  done: "stroke-practice",
  active: "stroke-brand-500",
  todo: "stroke-line",
};

type Segment = { d: string; tone: Tone };

/**
 * Los tramos del camino, en orden: cada uno va de un punto al siguiente (de la
 * cabecera de un módulo a su primera lección, de una lección a la siguiente, de
 * la última de un módulo a la cabecera del que viene). Su tono sale de las dos
 * lecciones que une, igual que antes: hecho entre dos completadas, activo entre
 * la última completada y la que toca, y "por hacer" en el resto.
 */
function buildSegments(
  modules: PathModule[],
  points: LaidPoint[],
): { segments: Segment[]; junctionTone: Tone[] } {
  const segments: Segment[] = [];
  const junctionTone: Tone[] = [];
  let cursor = 0;
  let previous: PathLesson | null = null;

  modules.forEach((module) => {
    const junction = points[cursor];
    const beforeJunction = cursor > 0 ? points[cursor - 1] : null;
    cursor += 1;
    const first = module.lessons[0];

    // El tono que entra al empalme (y sale de él hacia la primera lección).
    const tone: Tone = previous
      ? first
        ? toneBetween(previous, first)
        : "todo"
      : first?.state === "completed"
        ? "done"
        : first?.isCurrent
          ? "active"
          : "todo";
    junctionTone.push(tone);

    if (beforeJunction) segments.push({ d: curve(beforeJunction, junction), tone });

    let from = junction;
    module.lessons.forEach((lesson, index) => {
      const point = points[cursor];
      cursor += 1;
      const segmentTone = index === 0 ? tone : toneBetween(module.lessons[index - 1], lesson);
      segments.push({ d: curve(from, point), tone: segmentTone });
      from = point;
      previous = lesson;
    });
  });

  return { segments, junctionTone };
}

/**
 * El SVG del camino. Su viewBox va de -1 a 1 en horizontal (la posición `o` de
 * cada punto) y en píxeles reales en vertical, y `.bp-trace` lo coloca y
 * dimensiona con las mismas variables CSS que los nodos: a cualquier ancho la
 * curva pasa por el centro de cada nodo. Se estira solo en horizontal
 * (`preserveAspectRatio="none"`); el grosor y el punteado no se deforman
 * (`non-scaling-stroke`).
 */
function Trace({ segments, height }: { segments: Segment[]; height: number }) {
  const stroke = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const svg = {
    "aria-hidden": true,
    viewBox: `-1 0 2 ${height}`,
    preserveAspectRatio: "none" as const,
    width: "100%",
    height,
    style: { display: "block", overflow: "visible" } as CSSProperties,
  };

  const done = segments.filter((segment) => segment.tone === "done");
  const rest = segments.filter((segment) => segment.tone !== "done");

  return (
    <div className="bp-trace" style={{ height }}>
      {/* Lo ya recorrido, con un halo verde tenue debajo; se revela de arriba abajo. */}
      <div className="bp-trace-reveal absolute inset-0">
        <svg {...svg}>
          {done.map((segment, i) => (
            <g key={i}>
              <path d={segment.d} className="stroke-practice/20" strokeWidth={7} {...stroke} />
              <path d={segment.d} className={strokeByTone.done} strokeWidth={2.5} {...stroke} />
            </g>
          ))}
        </svg>
      </div>

      <svg {...svg} className="absolute inset-0">
        {rest.map((segment, i) => (
          <path
            key={i}
            d={segment.d}
            className={`${strokeByTone[segment.tone]} ${segment.tone === "active" ? "bp-path-flow" : ""}`}
            strokeWidth={segment.tone === "active" ? 2.5 : 2}
            strokeDasharray={segment.tone === "active" ? "6 6" : "1 7"}
            {...stroke}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------ Cabecera de módulo ----------------------------- */

/**
 * La cabecera de un módulo es un EMPALME del camino: un anillo por el que pasa
 * la traza, con el título al lado. Va del lado con sitio (el mismo criterio que
 * el texto de las lecciones), así que no tapa el camino ni se sale de pantalla.
 */
function SectorHeader({ module, point, tone }: { module: PathModule; point: LaidPoint; tone: Tone }) {
  const done = module.completed === module.total;

  return (
    <>
      <span
        aria-hidden
        className={`bp-node absolute z-10 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-canvas ${
          tone === "done"
            ? "border-practice"
            : tone === "active"
              ? "border-brand-500"
              : "border-fg-subtle/60"
        }`}
        style={{ ...offsetVar(point), top: JUNCTION_Y }}
      />

      <div
        className="bp-label top-0 items-start pt-5"
        data-side={point.side}
        style={{ ...offsetVar(point), height: HEAD }}
      >
        <div className="flex w-full max-w-[26rem] min-w-0 flex-col">
          <div className="bp-label-row flex items-center gap-3 font-mono text-[10.5px] tracking-[0.18em] uppercase">
            <span className="font-semibold text-fg-muted">
              Módulo {String(module.number).padStart(2, "0")}
            </span>
            <span aria-hidden className="h-px flex-1 bg-line" />
            <span className={`tabular-nums ${done ? "font-semibold text-practice-ink" : "text-fg-subtle"}`}>
              {done
                ? "Superado"
                : `${String(module.completed).padStart(2, "0")}/${String(module.total).padStart(2, "0")} AC`}
            </span>
          </div>

          <h3 className="mt-1.5 font-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
            {module.title}
          </h3>
          {module.summary && (
            <p className="mt-1 line-clamp-1 text-dense leading-5 text-fg-muted @lg:line-clamp-2">{module.summary}</p>
          )}

          <p className="bp-label-row mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] tracking-wider text-fg-subtle uppercase">
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
      </div>
    </>
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
    outOfEnergy: live.metered && live.signedIn && !live.isPremium && (live.remaining ?? 1) <= 0,
    isPremium: live.isPremium,
    countdown,
  };

  // La forma del camino sale SOLO de la estructura del curso: no depende del
  // progreso ni de la energía, así que no se mueve cuando se completa algo.
  const layout = layoutPath(modules.map((module) => ({ slug: module.slug, lessons: module.lessons.length })));
  const { segments, junctionTone } = buildSegments(modules, layout.points);

  return (
    <div className="bp-route">
      <ol className="bp-route-scope" style={{ height: layout.height }}>
        <Trace segments={segments} height={layout.height} />

        {modules.map((module, moduleIndex) => {
          const laid = layout.modules[moduleIndex];

          return (
            <li key={module.slug} className="absolute inset-x-0" style={{ top: laid.top, height: laid.height }}>
              <SectorHeader module={module} point={laid.junction} tone={junctionTone[moduleIndex]} />
              <ol>
                {module.lessons.map((lesson, lessonIndex) => (
                  <Row
                    key={lesson.slug}
                    lesson={lesson}
                    index={lessonIndex}
                    point={laid.lessons[lessonIndex]}
                    context={context}
                  />
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
