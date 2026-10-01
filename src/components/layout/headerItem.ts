/**
 * Aspecto común de los accesos de la barra superior: Cursos, energía, tokens
 * y cuenta.
 *
 * Son enlaces a páginas, no botones: por eso no llevan fondo ni borde en
 * reposo, solo el fondo tenue al pasar el ratón y el anillo de foco. El estado
 * "estás aquí" (`active`) es ese mismo fondo, algo más marcado, y lo acompaña
 * `aria-current="page"` en el propio enlace.
 *
 * Los colores son fijos (no del tema) porque las dos barras donde viven —la de
 * navegación y la cabecera de la lección— son siempre oscuras.
 *
 * No fija `display` ni `gap`: quien lo usa los decide (`inline-flex`, `hidden
 * sm:flex`, `gap-1.5`...), para que dos clases de la misma propiedad no
 * compitan en el mismo elemento.
 */
export function headerItemClass(active: boolean, extra = ""): string {
  return `focus-ring bp-press items-center rounded-control px-2 py-1.5 transition-colors hover:bg-white/5 hover:text-white ${
    active ? "bg-white/10 text-white" : ""
  } ${extra}`;
}

/** ¿La ruta actual es `href` o cuelga de ella? `/cursos/x/y` cuenta como `/cursos`. */
export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
