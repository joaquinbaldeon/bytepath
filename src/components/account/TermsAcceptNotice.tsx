"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { acceptCurrentTermsAction } from "@/lib/account/actions";
import { emptyAuthState } from "@/lib/auth/form-state";
import { legalDocuments, TERMS_VERSION } from "@/lib/legal/documents";
import { routes } from "@/lib/site";

/**
 * Para cuentas sin aceptación registrada de la versión vigente (creadas antes de
 * que existiera el registro, o tras publicarse una versión nueva). No bloquea
 * nada: si hay que exigirlo, es una DECISIÓN DE PRODUCTO pendiente.
 */
export function TermsAcceptNotice() {
  const [checked, setChecked] = useState(false);
  const [state, formAction, pending] = useActionState(acceptCurrentTermsAction, emptyAuthState);

  if (state.success) return <AuthMessage success={state.success} />;

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <p className="text-dense leading-6 text-fg-muted">
        No tenemos registrado que hayas aceptado la versión {TERMS_VERSION} de los{" "}
        <Link
          href={routes.terms}
          target="_blank"
          rel="noopener"
          className="focus-ring rounded-control font-medium text-brand-ink hover:underline"
        >
          {legalDocuments.terms.title}
        </Link>
        .
      </p>
      <label
        htmlFor="acceptTermsAccount"
        className="flex cursor-pointer items-start gap-2.5 text-dense leading-5 text-fg"
      >
        <input
          id="acceptTermsAccount"
          name="acceptTerms"
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          disabled={pending}
          className="focus-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-brand-500"
        />
        He leído y acepto los {legalDocuments.terms.title} de BytePath.
      </label>
      <input type="hidden" name="termsVersion" value={TERMS_VERSION} />
      <AuthMessage error={state.error} />
      <button
        type="submit"
        disabled={!checked || pending}
        className="focus-ring inline-flex h-10 items-center self-start rounded-control bg-brand-500 px-4 text-dense font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Aceptar
      </button>
    </form>
  );
}
