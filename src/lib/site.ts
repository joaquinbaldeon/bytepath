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
  energy: "/energia",
  store: "/tienda",
  terms: "/terminos",
  privacy: "/privacidad",
  passwordReset: "/recuperar",
  passwordUpdate: "/cuenta/contrasena",
  authConfirm: "/auth/confirmar",
  dataExport: "/api/cuenta/exportar",
} as const;

// Cursos va a su página, no al ancla de la Home: el ancla `/#cursos` sigue
// existiendo para los pilares de la portada, pero desde el header el destino es
// el catálogo.
export const navLinks = [
  { label: "Cursos", href: routes.courses },
  { label: "Problemas", href: "/#problemas", soon: true },
  { label: "Competición", href: "/#competicion", soon: true },
] as const;
