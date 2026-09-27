import { ArrowLeft, ChevronRight, FileText, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Container } from "@/components/ui/Container";
import { LEGAL_DRAFT, legalDocuments } from "@/lib/legal/documents";
import { routes } from "@/lib/site";

export type LegalSection = {
  /** Ancla estable: no la cambies al retocar el título, hay enlaces que apuntan a ella. */
  id: string;
  title: string;
  content: ReactNode;
};

/**
 * Armazón de las páginas legales (`/terminos`, `/privacidad`).
 *
 * La franja superior oscura es la de todas las páginas de BytePath (y la que
 * necesita la barra de navegación, transparente y con texto claro), pero corta:
 * aquí el protagonista es el texto. Debajo, el fondo es el del tema, claro u
 * oscuro, sin paneles: el documento se apoya en la página como una página de
 * documentación, con el índice a la izquierda en pantallas grandes y plegable
 * arriba en móvil.
 */
export function LegalPage({
  eyebrow,
  title,
  subtitle,
  meta,
  intro,
  sections,
  current,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Versión y fecha, o el estado del documento. */
  meta: ReactNode;
  /** Lo que va antes de las secciones (resumen, estado del documento). */
  intro?: ReactNode;
  sections: LegalSection[];
  current: keyof typeof legalDocuments;
}) {
  const other = current === "terms" ? legalDocuments.privacy : legalDocuments.terms;

  const toc = (
    <ol className="flex flex-col gap-0.5">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="focus-ring-tight group flex gap-2.5 rounded-control px-2 py-1.5 text-dense leading-5 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <span className="w-5 shrink-0 font-mono text-label leading-5 text-fg-subtle tabular-nums group-hover:text-brand-ink">
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-night-900 pt-24 pb-9 text-white sm:pt-28 sm:pb-11">
          <div
            aria-hidden
            className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_65%)]"
          />
          <Container>
            <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-dense">
              <Link
                href={routes.home}
                className="rounded-control text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
              >
                BytePath
              </Link>
              <ChevronRight aria-hidden className="size-3.5 text-slate-600" />
              <span className="text-slate-300">Legal</span>
            </nav>

            <p className="mt-6 font-mono text-label tracking-[0.2em] text-brand-300 uppercase">{eyebrow}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">{subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-slate-400">
              {meta}
            </div>
          </Container>
        </section>

        <div className="bg-canvas py-10 sm:py-14">
          <Container>
            <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
              <aside className="hidden lg:block">
                <nav aria-label="Índice del documento" className="sticky top-24">
                  <p className="px-2 font-mono text-label tracking-[0.18em] text-fg-subtle uppercase">Índice</p>
                  <div className="mt-3 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-1">{toc}</div>
                </nav>
              </aside>

              <article className="min-w-0 max-w-[68ch]">
                <Link
                  href={routes.home}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-control text-dense font-medium text-fg-muted transition-colors hover:text-fg"
                >
                  <ArrowLeft aria-hidden className="size-4" />
                  Volver a BytePath
                </Link>

                {LEGAL_DRAFT && (
                  <div
                    role="note"
                    className="mt-6 flex gap-3 rounded-card border border-energy/40 bg-energy-soft px-4 py-3.5"
                  >
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-energy-ink" />
                    <p className="text-dense leading-6 text-fg-body">
                      <span className="font-semibold text-energy-ink">Versión preliminar.</span> Los datos
                      del responsable del servicio todavía no están confirmados y aparecen marcados{" "}
                      <span className="font-mono text-energy-ink">[ASÍ]</span>. Se completarán antes de la
                      versión definitiva.
                    </p>
                  </div>
                )}

                {/* Índice plegable: en móvil no hay columna lateral. */}
                <details className="group mt-6 border-y border-line py-3 lg:hidden">
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between rounded-control text-dense font-medium text-fg [&::-webkit-details-marker]:hidden">
                    <span>Índice · {sections.length} secciones</span>
                    <ChevronRight aria-hidden className="size-4 text-fg-subtle transition-transform group-open:rotate-90" />
                  </summary>
                  <nav aria-label="Índice del documento" className="mt-3">
                    {toc}
                  </nav>
                </details>

                {intro && <div className="mt-8">{intro}</div>}

                <div className="mt-4">
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      id={section.id}
                      aria-labelledby={`${section.id}-titulo`}
                      className="scroll-mt-24 border-t border-line-soft pt-8 pb-2 first:border-t-0"
                    >
                      <h2
                        id={`${section.id}-titulo`}
                        className="flex items-baseline gap-3 font-display text-xl font-semibold tracking-tight text-fg"
                      >
                        <span className="font-mono text-sm font-medium text-fg-subtle tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <a href={`#${section.id}`} className="focus-ring rounded-control hover:text-brand-ink">
                          {section.title}
                        </a>
                      </h2>
                      <div className="mt-3.5 flex flex-col gap-4">{section.content}</div>
                    </section>
                  ))}
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={other.path}
                    className="focus-ring inline-flex items-center gap-2 rounded-control text-dense font-medium text-brand-ink hover:underline"
                  >
                    <FileText aria-hidden className="size-4" />
                    {other.title}
                    {other.version === null && <span className="font-normal text-fg-subtle">(en preparación)</span>}
                  </Link>
                  <Link
                    href={routes.home}
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line px-4 text-dense font-medium text-fg transition-colors hover:bg-surface-2"
                  >
                    <ArrowLeft aria-hidden className="size-4" />
                    Volver a BytePath
                  </Link>
                </div>
              </article>
            </div>
          </Container>
        </div>
      </main>
      <Footer />
    </>
  );
}
