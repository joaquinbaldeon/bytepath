import { BookOpen, Check, Coins, RefreshCw, Sparkles, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EnergyStatus } from "@/components/energy/EnergyStatus";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageHero } from "@/components/layout/PageHero";
import { actionClass } from "@/components/ui/actions";
import { Container } from "@/components/ui/Container";
import { ENERGY_REGEN_HOURS, FREE_MAX_ENERGY } from "@/lib/energy/config";
import { readAccountState } from "@/lib/energy/server";
import { routes } from "@/lib/site";
import { ENERGY_REFILL_COST, LESSON_COMPLETION_REWARD } from "@/lib/tokens/config";

export const metadata: Metadata = {
  title: "Energía · BytePath",
  description:
    "Cómo funciona la energía de BytePath: para qué sirve, cómo se recupera, qué tienen que ver los tokens y qué cambia con Premium.",
};

/**
 * Qué es la energía y cómo funciona, más el estado de quien mira.
 *
 * Explica el sistema que YA existe; no decide nada. Los números salen de las
 * mismas constantes que usa el resto de la interfaz (`energy/config.ts` y
 * `tokens/config.ts`, espejo de lo que hace la base de datos) y el estado
 * personal, de `get_account_state` a través de `readAccountState`, que solo
 * devuelve el de quien pide la página.
 *
 * Se puede visitar sin sesión: es una página que explica. Con sesión, arriba
 * aparece tu energía de ahora.
 */

function Explainer({
  icon: Icon,
  title,
  children,
  tone = "brand",
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  tone?: "brand" | "energy" | "practice";
}) {
  const soft = {
    brand: "bg-brand-soft text-brand-ink",
    energy: "bg-energy-soft text-energy-ink",
    practice: "bg-practice-soft text-practice-ink",
  }[tone];

  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold">
        <span className={`grid size-8 place-items-center rounded-card ${soft}`}>
          <Icon aria-hidden className="size-4" />
        </span>
        {title}
      </h2>
      <div className="mt-3.5 text-dense leading-6 text-fg-muted">{children}</div>
    </section>
  );
}

function Point({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Check aria-hidden className="mt-1 size-3.5 shrink-0 text-practice-ink" strokeWidth={3} />
      <span>{children}</span>
    </li>
  );
}

export default async function EnergyPage() {
  const account = await readAccountState();

  // Línea de tiempo de la recuperación, de 0 al tope: "ahora", "+3 h", "+6 h"...
  const timeline = Array.from({ length: FREE_MAX_ENERGY + 1 }, (_, step) => ({
    step,
    label: step === 0 ? "ahora" : `+${step * ENERGY_REGEN_HOURS} h`,
  }));

  return (
    <>
      <Navbar />
      <main>
        <PageHero eyebrow="energía" eyebrowClass="text-energy" title="Energía">
          La energía marca cuántas lecciones puedes completar seguidas. Estudiar siempre es gratis;
          la energía solo entra en juego al cerrar una lección.
        </PageHero>

        <section className="bg-canvas py-10 sm:py-12">
          <Container width="wide" className="flex flex-col gap-8">
            <EnergyStatus initial={account} />

            <div className="grid gap-4 lg:grid-cols-2">
              <Explainer icon={BookOpen} title="¿Para qué sirve?">
                <ul className="flex flex-col gap-2">
                  <Point>
                    <span className="font-medium text-fg">Abrir y estudiar una lección no gasta energía.</span>{" "}
                    Leer la teoría, hacer el quiz y probar el desafío no cuesta nada, aunque estés a 0.
                  </Point>
                  <Point>
                    <span className="font-medium text-fg">Completar una lección gasta 1 ⚡.</span> Se cobra
                    una sola vez por lección: repasarla después no cuesta nada.
                  </Point>
                  <Point>
                    <span className="font-medium text-fg">Tu progreso se guarda.</span> Si te quedas sin
                    energía, la lección queda en progreso con todo lo que hiciste, y la completas
                    cuando vuelva.
                  </Point>
                  <Point>
                    <span className="font-medium text-fg">La siguiente lección se abre al completar la anterior.</span>{" "}
                    El camino va en orden: cada lección se apoya en la de antes.
                  </Point>
                </ul>
              </Explainer>

              <Explainer icon={RefreshCw} title="Recuperación" tone="energy">
                <p>
                  <span className="font-medium text-fg">
                    +1 ⚡ cada {ENERGY_REGEN_HOURS} horas, hasta {FREE_MAX_ENERGY}.
                  </span>{" "}
                  Va por reloj, sin reinicios diarios: lo que no gastas se queda, y no hace falta
                  estar conectado para que vuelva.
                </p>

                <ol
                  aria-label={`Desde 0, la energía vuelve a ${FREE_MAX_ENERGY} en ${FREE_MAX_ENERGY * ENERGY_REGEN_HOURS} horas`}
                  className="mt-4 grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}
                >
                  {timeline.map(({ step, label }) => (
                    <li key={step} className="flex flex-col items-center gap-1.5">
                      <span
                        className={`grid h-9 w-full place-items-center rounded-control font-mono text-dense font-semibold tabular-nums ${
                          step === FREE_MAX_ENERGY
                            ? "bg-energy text-ink"
                            : "bg-energy-soft text-energy-ink"
                        }`}
                      >
                        {step} ⚡
                      </span>
                      <span className="font-mono text-label text-fg-subtle">{label}</span>
                    </li>
                  ))}
                </ol>
              </Explainer>

              <Explainer icon={Coins} title="Tokens y energía">
                <ul className="flex flex-col gap-2">
                  <Point>
                    Cada lección que completas te da{" "}
                    <span className="font-medium text-fg">{LESSON_COMPLETION_REWARD} tokens</span>.
                  </Point>
                  <Point>
                    Con <span className="font-medium text-fg">{ENERGY_REFILL_COST} tokens</span> llenas
                    la energía al máximo de golpe, sin esperar.
                  </Point>
                  <Point>
                    Es todo o nada: si no tienes {ENERGY_REFILL_COST}, o ya estás a tope, no se gasta
                    ningún token.
                  </Point>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={routes.store} className={actionClass("secondary", "sm")}>
                    <Coins aria-hidden className="size-4 text-brand-ink" />
                    Ir a la tienda
                  </Link>
                </div>
              </Explainer>

              <Explainer icon={Sparkles} title="Premium" tone="practice">
                <ul className="flex flex-col gap-2">
                  <Point>
                    <span className="font-medium text-fg">Energía ilimitada:</span> completar lecciones
                    no gasta energía y nunca hay que esperar.
                  </Point>
                  <Point>Sigues ganando tokens por cada lección que completas.</Point>
                  <Point>Sin anuncios en ninguna pantalla.</Point>
                  <Point>
                    La cuenta gratuita ya tiene todos los cursos y toda la teoría: Premium quita la
                    espera, no el contenido.
                  </Point>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={routes.premium} className={actionClass("quiet", "sm")}>
                    Qué incluye Premium
                  </Link>
                </div>
              </Explainer>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-panel border border-line bg-surface-2/50 px-6 py-8 text-center">
              <p className="font-display text-lg font-semibold">Lo importante es seguir aprendiendo</p>
              <p className="max-w-md text-dense text-fg-muted">
                La energía marca el ritmo, no lo que puedes estudiar: sin energía sigues leyendo y
                repasando, y completas la lección cuando vuelva.
              </p>
              <Link href={routes.courses} className={actionClass("primary")}>
                <Zap aria-hidden className="size-4 fill-current" />
                Volver a cursos
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
