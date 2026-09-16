import { ArrowRight, BookOpen, CodeXml, Trophy, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PathBranches } from "@/components/home/PathBranches";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { pillarAccent, pillars, type PillarId } from "@/lib/pillars";

const icons: Record<PillarId, LucideIcon> = {
  learn: BookOpen,
  practice: CodeXml,
  compete: Trophy,
};

export function PillarsOverview() {
  return (
    <section id="pilares" className="bg-paper py-24 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-brand-600 uppercase">
            La plataforma
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Tres pilares, una sola ruta
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Todo lo que necesitas para pasar de aprender la sintaxis a resolver
            problemas con soltura.
          </p>
        </Reveal>

        <PathBranches className="mt-10 hidden h-16 md:block" />

        <div className="mt-12 grid gap-5 md:mt-0 md:grid-cols-3">
          {pillars.map((pillar, i) => {
            const Icon = icons[pillar.id];
            const accent = pillarAccent[pillar.id];
            return (
              <Reveal key={pillar.id} delay={i * 0.1} className="h-full">
                <Link
                  href={pillar.href}
                  className={`group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgb(15_23_42/0.25)] ${accent.hoverBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid size-11 place-items-center rounded-xl ${accent.soft}`}>
                      <Icon aria-hidden className="size-5" />
                    </span>
                    {pillar.soon && <Badge tone="soon">Próximamente</Badge>}
                  </div>
                  <p className={`mt-6 font-mono text-xs ${accent.ink}`}>
                    {pillar.step} · {pillar.verb}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate-600">
                    {pillar.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                    {pillar.cta}
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
