"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/components/theme/ThemeScript";

/**
 * Alterna el tema escribiendo directamente en <html> y en localStorage.
 *
 * No guarda estado en React a propósito: qué icono se ve lo decide el CSS a
 * partir de data-theme, así que el servidor y el cliente renderizan lo mismo y
 * no hay ni parpadeo ni aviso de hidratación.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("theme-transition");
      window.setTimeout(() => root.classList.remove("theme-transition"), 220);
    }

    root.dataset.theme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Modo privado o almacenamiento bloqueado: el tema dura la sesión.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${className}`}
    >
      <Moon aria-hidden className="size-4.5 dark:hidden" />
      <Sun aria-hidden className="hidden size-4.5 dark:block" />
      <span className="sr-only dark:hidden">Cambiar a modo oscuro</span>
      <span className="sr-only hidden dark:inline">Cambiar a modo claro</span>
    </button>
  );
}
