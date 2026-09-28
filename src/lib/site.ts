// Rutas de la plataforma. Problemas y Competición todavía no tienen página:
// se enlazan a su sección de la Home (con «Pronto»), nunca a una ruta que daría
// 404. Cuando existan, se añaden aquí.
export const routes = {
  home: "/",
  courses: "/cursos",
  login: "/login",
  signup: "/registro",
  premium: "/premium",
  account: "/cuenta",
  terms: "/terminos",
  privacy: "/privacidad",
  passwordReset: "/recuperar",
  passwordUpdate: "/cuenta/contrasena",
  authConfirm: "/auth/confirmar",
  dataExport: "/api/cuenta/exportar",
} as const;

export const navLinks = [
  { label: "Cursos", href: "/#cursos" },
  { label: "Problemas", href: "/#problemas", soon: true },
  { label: "Competición", href: "/#competicion", soon: true },
] as const;
