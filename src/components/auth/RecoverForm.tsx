"use client";

import { useActionState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { emptyAuthState } from "@/lib/auth/form-state";

/**
 * Pedir el enlace para elegir una contraseña nueva. La respuesta es la misma
 * exista o no la cuenta (ver `requestPasswordResetAction`).
 */
export function RecoverForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, emptyAuthState);

  if (state.notice) return <AuthMessage notice={state.notice} />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        hint="El de tu cuenta de BytePath."
        autoComplete="email"
        required
        disabled={pending}
        placeholder="tu@correo.com"
      />
      <AuthMessage error={state.error} />
      <SubmitButton pending={pending} pendingLabel="Enviando…">
        Enviarme el enlace
      </SubmitButton>
    </form>
  );
}
