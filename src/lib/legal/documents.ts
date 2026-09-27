/**
 * Documentos legales de BytePath: versiones, fechas y datos de contacto.
 *
 * Es el ÚNICO sitio donde vive la versión vigente de cada documento. La página
 * `/terminos`, el formulario de registro y la acción que da de alta la cuenta
 * la leen de aquí, así que publicar una versión nueva de los Términos es:
 *
 *   1. editar el texto (`src/content/legal/terms.tsx`);
 *   2. cambiar `TERMS_VERSION` y `updatedAt` aquí abajo;
 *   3. registrar esa versión en la base de datos ANTES de desplegar
 *      (`insert into public.legal_documents ...`, ver supabase/legal.sql):
 *      el alta de cuentas y la aceptación desde /cuenta solo guardan la versión
 *      que la base de datos considera vigente.
 *
 * La Política de Privacidad no se acepta: se informa. Su versión y fecha solo se
 * muestran en su página y no se registran en la base de datos.
 *
 * Se puede importar desde cliente y servidor: no hay nada secreto.
 */

export type LegalDocumentType = "terms" | "privacy";

export type LegalDocument = {
  type: LegalDocumentType;
  title: string;
  path: string;
  /** `null` mientras el documento no esté redactado y publicado. */
  version: string | null;
  /** Fecha de la versión vigente (AAAA-MM-DD). */
  updatedAt: string | null;
};

export const TERMS_VERSION = "1.1";

export const legalDocuments: Record<LegalDocumentType, LegalDocument> = {
  terms: {
    type: "terms",
    title: "Términos y Condiciones",
    path: "/terminos",
    version: TERMS_VERSION,
    updatedAt: "2026-09-27",
  },
  privacy: {
    type: "privacy",
    title: "Política de Privacidad",
    path: "/privacidad",
    version: "1.0",
    updatedAt: "2026-09-27",
  },
};

/* ---------------------------- Datos de contacto ---------------------------- */

/**
 * Cómo se identifica BytePath en los documentos.
 *
 * BytePath es un proyecto educativo de un equipo de estudiantes: NO es una
 * sociedad ni una persona jurídica, así que no hay razón social, RUC,
 * representante ni domicilio empresarial que mostrar, y no se deben inventar.
 * Quién debe figurar formalmente como responsable del tratamiento de datos es
 * una cuestión PENDIENTE de revisión legal (ver docs/security-privacy.md).
 *
 * Solo lleva valor lo que está confirmado. Mientras un campo sea `null`, los
 * documentos muestran su marcador (`[CORREO DE CONTACTO]`...) bien visible y
 * aparece el aviso de versión preliminar.
 */
export const LEGAL_OWNER: Record<LegalOwnerField, string | null> = {
  /** Dónde se desarrolla el proyecto. */
  location: "Lima, Perú",
  email: "bytepath.learning.contact@gmail.com",
  /** Se lee dentro de una frase («… por la legislación de …»). */
  jurisdiction: "Perú",
};

export type LegalOwnerField = "location" | "email" | "jurisdiction";

export const LEGAL_PLACEHOLDERS: Record<LegalOwnerField, string> = {
  location: "[UBICACIÓN]",
  email: "[CORREO DE CONTACTO]",
  jurisdiction: "[PAÍS / JURISDICCIÓN]",
};

/** Quedan datos sin confirmar: el documento es una versión preliminar. */
export const LEGAL_DRAFT = Object.values(LEGAL_OWNER).some((value) => value === null);

/** "2026-09-26" → "26 de septiembre de 2026", sin depender de la zona horaria del servidor. */
export function formatLegalDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}
