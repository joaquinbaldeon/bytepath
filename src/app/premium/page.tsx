import { Check, Coins, Minus, Sparkles, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { coursesPath } from "@/lib/courses/api";
import { ENERGY_REGEN_HOURS, FREE_MAX_ENERGY } from "@/lib/energy/config";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

export const metadata: Metadata = {
  title: "Premium · BytePath",
  description:
    "Qué incluye la cuenta gratuita de BytePath y qué añadirá Premium: energía ilimitada y sin anuncios.",
};

/**
 * Página informativa de Premium.
 *
 * No hay cobro ni pasarela: es deliberado. Lo que sí hay es el sitio donde
 * entrará el checkout el día que exista, y la explicación honesta de qué
 * separa una cuenta de la otra.
 *
 * Se queda estática: no lee la sesión. Enseñar aquí "ya eres Premium"
 * obligaría a renderizarla bajo demanda a cambio de poco, y quien ya es
 * Premium lo ve en el ∞ de la barra.
 */

const FREE_FEATURES = [
  { included: true, text: "Todos los cursos y toda la teoría, completos" },
  { included: true, text: `Hasta ${FREE_MAX_ENERGY} energías a la vez, +1 cada ${ENERGY_REGEN_HOURS} horas` },
  { included: true, text: `${LESSON_COMPLETION_REWARD} tokens por cada lección que completas` },
  { included: true, text: "Compilación real de tu código en cada desafío" },
  { included: true, text: "Quizzes y seguimiento de progreso" },
  { included: false, text: "Con anuncios" },
];

const PREMIUM_FEATURES = [
  { included: true, text: "Todo lo de la cuenta gratuita" },
  { included: true, text: "Energía ilimitada: nunca esperas ni gastas tokens en ella" },
  { included: true, text: "Sigues ganando tokens por completar lecciones" },
  { included: true, text: "Sin anuncios en ninguna pantalla" },
];

function FeatureList({ items }: { items: { included: boolean; text: string }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.text} className="flex gap-2.5 text-dense leading-6">
          {item.included ? (
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-practice-ink" />
          ) : (
            <Minus aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
          )}
          <span className={item.included ? "text-fg-body" : "text-fg-muted"}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PremiumPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-night-900 pt-24 pb-10 text-white sm:pt-28 sm:pb-12">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
          />
          <Container width="wide">
            <p className="font-mono text-label tracking-[0.2em] text-energy uppercase">
              Energía y Premium
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Aprender no cuesta. Correr, un poco.
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
              BytePath es gratis y lo va a seguir siendo: los cursos enteros, la teoría entera y el
              compilador de verdad. La energía solo marca cuántas lecciones puedes completar
              seguidas, y se regenera sola. Premium quita ese ritmo y los anuncios.
            </p>
          </Container>
        </section>

        <section className="bg-canvas py-10 sm:py-12">
          <Container width="wide">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Gratis */}
              <div className="rounded-panel border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Gratis</h2>
                  <Badge tone="neutral">Lo que tienes ahora</Badge>
                </div>

                <p className="mt-4 flex items-center gap-1" aria-hidden>
                  {Array.from({ length: FREE_MAX_ENERGY }, (_, i) => (
                    <Zap key={i} className="size-5 fill-energy text-energy" />
                  ))}
                </p>
                <p className="mt-2 text-dense text-fg-muted">
                  Hasta {FREE_MAX_ENERGY} energías a la vez. Se regeneran solas, +1 cada{" "}
                  {ENERGY_REGEN_HOURS} horas, sin esperar a ningún reinicio.
                </p>

                <div className="mt-6 border-t border-line pt-5">
                  <FeatureList items={FREE_FEATURES} />
                </div>

                <Link
                  href={coursesPath}
                  className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center rounded-control border border-line font-medium transition-colors hover:bg-surface-2"
                >
                  Ir a los cursos
                </Link>
              </div>

              {/* Premium */}
              <div className="rounded-panel border border-brand-400/40 bg-surface p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <Sparkles aria-hidden className="size-5 text-brand-ink" />
                    Premium
                  </h2>
                  <Badge tone="soon">Próximamente</Badge>
                </div>

                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl leading-none font-semibold text-brand-ink">
                    ∞
                  </span>
                  <span className="text-dense text-fg-muted">energía, sin esperas</span>
                </p>

                <div className="mt-6 border-t border-line pt-5">
                  <FeatureList items={PREMIUM_FEATURES} />
                </div>

                {/* Aquí entrará el checkout. Mientras no exista, el botón no
                    finge: está deshabilitado y lo dice. */}
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-control bg-brand-500/50 font-medium text-white"
                >
                  Disponible próximamente
                </button>

                <p className="mt-3 text-center text-dense text-fg-subtle">
                  Todavía no hay precio ni forma de pago. Cuando la haya, se anunciará aquí.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-panel border border-line bg-surface-2/60 p-6">
              <h2 className="font-display text-lg font-semibold">Energía y tokens, en corto</h2>
              <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-dense font-medium">Se gasta al completar</dt>
                  <dd className="mt-1 text-dense leading-6 text-fg-muted">
                    Una energía al terminar una lección: cuando el quiz y el desafío están
                    superados. Abrirla, leerla y hacer el quiz no cuesta nada.
                  </dd>
                </div>
                <div>
                  <dt className="text-dense font-medium">Sin energía, sigues leyendo</dt>
                  <dd className="mt-1 text-dense leading-6 text-fg-muted">
                    Con 0 ⚡ puedes abrir, leer y repasar cualquier lección: solo queda en
                    progreso hasta que vuelva 1. Completar una lección se cobra una sola vez.
                  </dd>
                </div>
                <div>
                  <dt className="text-dense font-medium">Se regenera por reloj</dt>
                  <dd className="mt-1 text-dense leading-6 text-fg-muted">
                    +1 energía cada {ENERGY_REGEN_HOURS} horas, hasta {FREE_MAX_ENERGY}. Lo que no
                    gastas se queda: no hay ningún reinicio que lo borre.
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-dense font-medium">
                    <Coins aria-hidden className="size-3.5 text-brand-ink" />
                    Los tokens aceleran
                  </dt>
                  <dd className="mt-1 text-dense leading-6 text-fg-muted">
                    Cada lección completada da {LESSON_COMPLETION_REWARD} tokens. Con{" "}
                    {ENERGY_REFILL_COST} puedes recargar la energía al momento, sin esperar.
                  </dd>
                </div>
              </dl>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
