import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/lib/site";

/**
 * Armazón de las páginas de cuenta.
 *
 * El fondo oscuro con retícula se conserva: es la firma visual de BytePath y
 * lo que hace que estas páginas se reconozcan como parte del sitio.
 *
 * La tarjeta, en cambio, usa tokens semánticos y sí sigue el tema. Antes toda
 * la página iba con colores fijos, así que quien tuviera el modo claro se
 * encontraba con la única pantalla del producto que lo ignoraba.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night-900 px-5 py-16">
      <div
        aria-hidden
        className="bg-dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
      />

      <Container className="flex flex-col items-center">
        <Link
          href={routes.home}
          aria-label="BytePath, inicio"
          className="focus-ring rounded-control"
        >
          <Logo />
        </Link>

        <div className="mt-7 w-full max-w-md rounded-panel border border-line bg-surface p-6 shadow-card sm:p-7">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          <p className="mt-2 text-dense leading-6 text-fg-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-dense text-slate-400">{footer}</p>
      </Container>
    </main>
  );
}
