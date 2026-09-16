import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { routes } from "@/lib/site";

const columns = [
  {
    title: "Plataforma",
    links: [
      { label: "Cursos", href: routes.courses },
      { label: "Problemas", href: routes.problems },
      { label: "Competición", href: routes.competition },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { label: "Iniciar sesión", href: routes.login },
      { label: "Crear cuenta", href: routes.signup },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-night-950 text-slate-400">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Aprende. Practica. Compite. Tu ruta en la programación competitiva con C++.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/5">
        <Container className="py-6 text-xs">
          © {new Date().getFullYear()} BytePath. Todos los derechos reservados.
        </Container>
      </div>
    </footer>
  );
}
