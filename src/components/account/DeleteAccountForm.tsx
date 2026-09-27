"use client";

import { TriangleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { deleteAccountAction } from "@/lib/account/actions";
import { emptyAuthState } from "@/lib/auth/form-state";

/**
 * Eliminar la cuenta. Dos pasos a propósito: primero se despliega, y para
 * confirmar hay que escribir ELIMINAR y la contraseña. Dice con claridad qué se
 * borra y qué queda fuera del alcance de BytePath.
 */
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteAccountAction, emptyAuthState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex h-10 items-center rounded-control border border-hard/40 px-4 text-dense font-medium text-danger-ink transition-colors hover:bg-danger-soft"
      >
        Eliminar mi cuenta…
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card border border-hard/40 bg-danger-soft/40 p-4">
      <div className="flex gap-2.5 text-dense leading-6 text-fg-body">
        <TriangleAlert aria-hidden className="mt-1 size-4 shrink-0 text-danger-ink" />
        <div>
          <p className="font-semibold text-danger-ink">Esto no se puede deshacer.</p>
          <p className="mt-1">
            Se borran tu cuenta, tu perfil, tu progreso, tu energía, tus tokens y su historial, y el
            registro de los Términos que aceptaste.
          </p>
          <p className="mt-1 text-fg-muted">
            BytePath no controla las copias de seguridad de su proveedor de base de datos, los registros
            técnicos de sus proveedores ni el código que ya se envió al servicio de ejecución: esos se rigen
            por los plazos de cada proveedor.
          </p>
        </div>
      </div>

      <AuthField
        id="deletePassword"
        name="password"
        type="password"
        label="Tu contraseña"
        autoComplete="current-password"
        required
        disabled={pending}
      />
      <AuthField
        id="deleteConfirmation"
        name="confirmation"
        label="Escribe ELIMINAR para confirmar"
        autoComplete="off"
        required
        disabled={pending}
      />
      <AuthMessage error={state.error} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center rounded-control bg-hard px-4 text-dense font-medium text-white transition-colors hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Eliminando…" : "Eliminar definitivamente"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center rounded-control border border-line px-4 text-dense font-medium transition-colors hover:bg-surface-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
