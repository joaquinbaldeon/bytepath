"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { EnergyMeter } from "@/components/energy/EnergyMeter";
import { headerItemClass, isActivePath } from "@/components/layout/headerItem";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { TokenBadge } from "@/components/tokens/TokenBadge";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { navLinks, routes } from "@/lib/site";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  // Solo los enlaces a páginas reales pueden estar "activos"; los de la Home
  // (`/#problemas`) nunca, porque no son una página.
  const isCurrent = (href: string) => !href.includes("#") && isActivePath(pathname, href);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  const close = () => setOpen(false);
  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        solid
          ? "border-white/10 bg-night-900/85 backdrop-blur-lg"
          : "border-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href={routes.home}
          aria-label="BytePath, inicio"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400"
        >
          <Logo />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={headerItemClass(isCurrent(link.href), "flex gap-2 text-sm text-slate-300")}
            >
              {link.label}
              {"soon" in link && <Badge tone="soonDark">Pronto</Badge>}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle className="text-slate-300 hover:bg-white/5 hover:text-white" />
          <UserMenu />
        </div>

        {/* En móvil, energía y tokens quedan fijos en la barra: son lo que más
            se consulta y no deberían esconderse detrás del menú. Cada uno se
            pinta solo si hay sesión. */}
        <div className="flex items-center gap-0.5 lg:hidden">
          <EnergyMeter />
          <TokenBadge />
          <ThemeToggle className="text-slate-300 hover:bg-white/5 hover:text-white" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid size-10 place-items-center rounded-lg text-slate-200 transition-colors hover:bg-white/5"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 lg:hidden"
          >
            <Container className="flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3 py-3 text-slate-200 transition-colors hover:bg-white/5 ${
                    isCurrent(link.href) ? "bg-white/10 text-white" : ""
                  }`}
                >
                  {link.label}
                  {"soon" in link && <Badge tone="soonDark">Pronto</Badge>}
                </Link>
              ))}
              <div className="mt-3">
                <UserMenu onNavigate={close} showMeters={false} />
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
