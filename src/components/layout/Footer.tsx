import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { CodeMotto } from "@/components/ui/CodeMotto";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { legalDocuments } from "@/lib/legal/documents";
import { routes } from "@/lib/site";

type FooterLink = { label: string; href: string; soon?: boolean };

// Problemas y Competición todavía no tienen página: llevan a su sección de la
// Home, que lo explica, y se marcan como «Pronto».
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Plataforma",
    links: [
      { label: "Cursos", href: routes.courses },
      { label: "Problemas", href: "/#problemas", soon: true },
      { label: "Competición", href: "/#competicion", soon: true },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { label: "Iniciar sesión", href: routes.login },
      { label: "Crear cuenta", href: routes.signup },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: legalDocuments.terms.title, href: routes.terms },
      { label: legalDocuments.privacy.title, href: routes.privacy },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-night-950 text-slate-400">
      <Container className="grid gap-10 py-14 sm:grid-cols-3 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="sm:col-span-3 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Aprende. Practica. Compite. Tu ruta en la programación competitiva con C++.
          </p>
          <CodeMotto className="mt-5 inline-block rounded-control border border-white/5 bg-white/[0.03] px-3 py-2.5" />
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-control transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                  >
                    {link.label}
                    {link.soon && <Badge tone="soonDark">Pronto</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/5">
        <Container className="flex flex-col gap-1 py-6 text-xs sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} BytePath.</span>
          <span className="text-slate-500">Un proyecto de estudiantes, para estudiantes que programan.</span>
        </Container>
      </div>
    </footer>
  );
}
