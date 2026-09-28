import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/lib/site";

/**
 * Pantalla de estado de BytePath (404, error inesperado): el mismo armazón que
 * las páginas de cuenta —fondo oscuro con retícula, logo y una tarjeta—, para
 * que un fallo siga pareciendo parte del sitio y siempre ofrezca una salida.
 *
 * Sin hooks ni estado: la usan tanto `not-found.tsx` (servidor) como
 * `error.tsx` y `global-error.tsx` (cliente).
 */
export function StatusScreen({
  code,
  title,
  description,
  actions,
  footnote,
}: {
  /** Rótulo corto sobre el título, p. ej. «Error 404». */
  code: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night-900 px-5 py-16">
      <div
        aria-hidden
        className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
      />

      <Container className="flex flex-col items-center">
        <Link href={routes.home} aria-label="BytePath, inicio" className="focus-ring rounded-control">
          <Logo />
        </Link>

        <div className="mt-7 w-full max-w-md rounded-panel border border-line bg-surface p-6 shadow-card sm:p-7">
          <p className="font-mono text-label tracking-[0.2em] text-brand-ink uppercase">{code}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          <div className="mt-2 text-dense leading-6 text-fg-muted">{description}</div>
          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
        </div>

        {footnote && <p className="mt-5 text-center text-dense text-slate-400">{footnote}</p>}
      </Container>
    </main>
  );
}

/** Mismo aspecto que `Button` (primario), para acciones que no son enlaces. */
export const primaryActionClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgb(109_94_246/0.7)] transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400";
