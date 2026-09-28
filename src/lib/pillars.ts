export type PillarId = "learn" | "practice" | "compete";

// Clases completas (no interpoladas) para que Tailwind las detecte.
export const pillarAccent: Record<
  PillarId,
  { ink: string; soft: string; dot: string; hoverBorder: string; stroke: string }
> = {
  learn: {
    ink: "text-learn-ink",
    soft: "bg-learn/10 text-learn-ink",
    dot: "bg-learn",
    hoverBorder: "hover:border-learn/50",
    stroke: "stroke-learn",
  },
  practice: {
    ink: "text-practice-ink",
    soft: "bg-practice/10 text-practice-ink",
    dot: "bg-practice",
    hoverBorder: "hover:border-practice/50",
    stroke: "stroke-practice",
  },
  compete: {
    ink: "text-compete-ink",
    soft: "bg-compete/10 text-compete-ink",
    dot: "bg-compete",
    hoverBorder: "hover:border-compete/50",
    stroke: "stroke-compete",
  },
};

export const pillars = [
  {
    id: "learn",
    step: "01",
    verb: "Aprende",
    title: "Cursos",
    description:
      "Módulos y lecciones cortas con teoría, cuestionarios y ejercicios para avanzar paso a paso.",
    href: "/#cursos",
    cta: "Ver cursos",
    soon: false,
  },
  {
    id: "practice",
    step: "02",
    verb: "Practica",
    title: "Problemas",
    description:
      "Un banco de problemas por dificultad y tema. Mientras llega, practica con los desafíos de cada lección.",
    href: "/#problemas",
    cta: "Ver problemas",
    soon: true,
  },
  {
    id: "compete",
    step: "03",
    verb: "Compite",
    title: "Competición",
    description:
      "Prepárate para concursos de programación competitiva y mide tu nivel frente a otros.",
    href: "/#competicion",
    cta: "Saber más",
    soon: true,
  },
] as const satisfies ReadonlyArray<{ id: PillarId } & Record<string, unknown>>;
