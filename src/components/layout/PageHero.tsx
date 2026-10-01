import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/site";

/**
 * Cabecera oscura de las páginas de producto: la misma banda con retícula que
 * usan /cursos y /premium, con un rótulo en forma de comentario (`// tienda`).
 *
 * Lleva de serie la vuelta al aprendizaje ("Volver a cursos"): las páginas
 * secundarias —tienda, energía, cuenta— no deben ser un callejón sin salida.
 */
export function PageHero({
  eyebrow,
  eyebrowClass = "text-brand-300",
  title,
  children,
  width = "wide",
  backToCourses = true,
}: {
  /** Sin las barras: se pintan solas. `"tienda"` → `// tienda`. */
  eyebrow: string;
  eyebrowClass?: string;
  title: string;
  children?: ReactNode;
  width?: "wide" | "reading";
  backToCourses?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-night-900 pt-24 pb-10 text-white sm:pt-28 sm:pb-12">
      <div
        aria-hidden
        className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />
      <Container width={width}>
        {backToCourses && (
          <Link
            href={routes.courses}
            className="focus-ring group mb-5 inline-flex items-center gap-1.5 rounded-control text-dense text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Volver a cursos
          </Link>
        )}
        <p className={`font-mono text-label ${eyebrowClass}`}>{`// ${eyebrow}`}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {children && <div className="mt-3 max-w-2xl leading-relaxed text-slate-300">{children}</div>}
      </Container>
    </section>
  );
}
