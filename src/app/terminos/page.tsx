import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { termsSections } from "@/content/legal/terms";
import { formatLegalDate, LEGAL_DRAFT, legalDocuments } from "@/lib/legal/documents";

const terms = legalDocuments.terms;

export const metadata: Metadata = {
  title: "Términos y Condiciones | BytePath",
  description:
    "Condiciones de uso de BytePath, la plataforma educativa para aprender C++ y programación competitiva: cuentas, progreso, energía, tokens y ejecución de código.",
  // Mientras queden datos del responsable sin confirmar, el documento es un
  // borrador: se puede leer y enlazar, pero no debe aparecer en buscadores con
  // marcadores como "[CORREO DE CONTACTO]". Se indexa solo cuando `LEGAL_DRAFT` es falso.
  robots: LEGAL_DRAFT ? { index: false, follow: true } : undefined,
};

export default function TermsPage() {
  return (
    <LegalPage
      current="terms"
      eyebrow="Legal · BytePath"
      title={terms.title}
      subtitle="Las condiciones de uso de BytePath, la plataforma para aprender C++ y programación competitiva."
      meta={
        <>
          <span>Versión {terms.version}</span>
          {terms.updatedAt && (
            <>
              <span aria-hidden>·</span>
              <span>
                Última actualización: <time dateTime={terms.updatedAt}>{formatLegalDate(terms.updatedAt)}</time>
              </span>
            </>
          )}
        </>
      }
      intro={
        <section aria-labelledby="resumen" className="border-l-2 border-brand-500/60 pl-4">
          <h2 id="resumen" className="font-mono text-label tracking-[0.18em] text-fg-subtle uppercase">
            Lo esencial
          </h2>
          <ul className="mt-2.5 flex flex-col gap-1.5 text-dense leading-6 text-fg-muted">
            <li>BytePath es gratuito. Hoy no se puede pagar nada en la plataforma.</li>
            <li>Para crear una cuenta confirmas que tienes 14 años o más. No te pedimos tu fecha de nacimiento.</li>
            <li>La energía y los tokens son internos: no son dinero ni se pueden canjear.</li>
            <li>El código de los desafíos se ejecuta en un servicio externo; no incluyas datos personales en él.</li>
            <li>Tu privacidad se regula en un documento aparte, la Política de Privacidad.</li>
          </ul>
          <p className="mt-2.5 text-label text-fg-subtle">Este resumen no sustituye al texto completo.</p>
        </section>
      }
      sections={termsSections}
    />
  );
}
