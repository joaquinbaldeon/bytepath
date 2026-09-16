// Rutas de la plataforma. Las páginas aún no existen: la Home ya enlaza a ellas
// para que solo haya que crearlas cuando se implementen.
export const routes = {
  home: "/",
  courses: "/cursos",
  problems: "/problemas",
  competition: "/competicion",
  login: "/login",
  signup: "/registro",
} as const;

export const navLinks = [
  { label: "Cursos", href: "/#cursos" },
  { label: "Problemas", href: "/#problemas" },
  { label: "Competición", href: "/#competicion", soon: true },
] as const;
