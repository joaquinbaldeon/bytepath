import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { pillarAccent, pillars, type PillarId } from "@/lib/pillars";

type FeatureSectionProps = {
  id: string;
  pillar: PillarId;
  title: string;
  description: string;
  points: string[];
  visual: ReactNode;
  action?: ReactNode;
  reverse?: boolean;
  className?: string;
};

export function FeatureSection({
  id,
  pillar,
  title,
  description,
  points,
  visual,
  action,
  reverse = false,
  className = "",
}: FeatureSectionProps) {
  const accent = pillarAccent[pillar];
  const meta = pillars.find((p) => p.id === pillar)!;

  return (
    <section id={id} className={`overflow-hidden py-24 sm:py-32 ${className}`}>
      <Container className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal className={reverse ? "lg:order-2" : ""}>
          <div className="flex items-center gap-3">
            <p className={`font-mono text-xs tracking-[0.2em] uppercase ${accent.ink}`}>
              {meta.step} · {meta.verb}
            </p>
            {meta.soon && <Badge tone="soon">Próximamente</Badge>}
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">{description}</p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-[15px] text-slate-700">
                <span
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${accent.soft}`}
                >
                  <Check aria-hidden className="size-3" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          {action && <div className="mt-10">{action}</div>}
        </Reveal>

        <Reveal delay={0.15} className={reverse ? "lg:order-1" : ""}>
          {visual}
        </Reveal>
      </Container>
    </section>
  );
}
