"use client";

import { useActionState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { updatePasswordAction } from "@/lib/account/actions";
import { emptyAuthState } from "@/lib/auth/form-state";

/**
 * Elegir una contraseña nueva. `requireCurrent` es falso solo cuando se llega
 * desde el enlace de recuperación (lo decide el servidor, y lo vuelve a
 * comprobar al enviar).
 */
export function PasswordForm({ requireCurrent }: { requireCurrent: boolean }) {
  const [state, formAction, pending] = useActionState(updatePasswordAction, emptyAuthState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {requireCurrent && (
        <AuthField
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Contraseña actual"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      )}
      <AuthField
        id="password"
        name="password"
        type="password"
        label="Contraseña nueva"
        hint="Al menos 6 caracteres."
        autoComplete="new-password"
        required
        minLength={6}
        disabled={pending}
      />
      <AuthField
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        label="Repite la contraseña nueva"
        autoComplete="new-password"
        required
        minLength={6}
        disabled={pending}
      />
      <AuthMessage error={state.error} />
      <SubmitButton pending={pending} pendingLabel="Guardando…">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}
