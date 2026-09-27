import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { privacySections } from "@/content/legal/privacy";
import { formatLegalDate, LEGAL_DRAFT, legalDocuments } from "@/lib/legal/documents";

const privacy = legalDocuments.privacy;

export const metadata: Metadata = {
  title: "Política de Privacidad | BytePath",
  description:
    "Qué datos trata BytePath, para qué, con qué proveedores (Supabase y Judge0), qué cookies usa y cómo descargar o eliminar tus datos.",
  // Igual que /terminos: mientras quede algún dato de contacto sin confirmar, no se indexa.
  robots: LEGAL_DRAFT ? { index: false, follow: true } : undefined,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      eyebrow="Legal · BytePath"
      title={privacy.title}
      subtitle="Qué datos trata BytePath, para qué y qué puedes hacer con ellos."
      meta={
        <>
          <span>Versión {privacy.version}</span>
          {privacy.updatedAt && (
            <>
              <span aria-hidden>·</span>
              <span>
                Última actualización: <time dateTime={privacy.updatedAt}>{formatLegalDate(privacy.updatedAt)}</time>
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
            <li>Para tu cuenta: correo, nombre de usuario y contraseña (la guarda Supabase como hash).</li>
            <li>No te pedimos edad ni fecha de nacimiento: solo que confirmes tener 14 años o más, y no lo guardamos.</li>
            <li>El código de los desafíos se ejecuta en Judge0, un servicio externo: no incluyas datos personales en él.</li>
            <li>Sin analítica, sin publicidad y sin venta de datos.</li>
          </ul>
          <p className="mt-2.5 text-label text-fg-subtle">Este resumen no sustituye al texto completo.</p>
        </section>
      }
      sections={privacySections}
    />
  );
}
