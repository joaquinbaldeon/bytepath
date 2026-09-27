"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { signUpAction } from "@/lib/auth/actions";
import { emptyAuthState } from "@/lib/auth/form-state";
import { AGE_CONFIRMATION_FIELD, TERMS_ACCEPTANCE_FIELD } from "@/lib/auth/signup-consents";
import { legalDocuments, TERMS_VERSION } from "@/lib/legal/documents";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { routes } from "@/lib/site";
import {
  USERNAME_HTML_PATTERN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_RULES_HINT,
} from "@/lib/auth/username";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUpAction, emptyAuthState);
  const router = useRouter();
  /**
   * Las dos casillas obligatorias, independientes: confirmar 14 años o más y
   * aceptar los Términos. Empiezan SIN marcar y el botón no se habilita hasta
   * que se marcan las dos: tiene que ser un gesto explícito para cada una. Es
   * solo la mitad visible; `signUpAction` las vuelve a exigir en el servidor
   * (signup-consents.ts).
   */
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!state.success) return;

    let cancelled = false;

    async function enter() {
      try {
        await createSupabaseBrowserClient().auth.getSession();
      } catch {
        // La barra se resincroniza igualmente al cambiar de ruta.
      }
      if (cancelled) return;
      router.push(routes.courses);
      router.refresh();
    }

    void enter();
    return () => {
      cancelled = true;
    };
  }, [state.success, router]);

  // Cuenta creada pendiente de confirmar el correo: el formulario ya no sirve
  // de nada y dejarlo visible invitaría a registrarse otra vez.
  if (state.notice) {
    return (
      <div className="flex flex-col gap-4">
        <AuthMessage notice={state.notice} />
        <p className="text-dense leading-6 text-fg-muted">
          ¿Ya lo has confirmado?{" "}
          <Link
            href={routes.login}
            className="focus-ring rounded-control font-medium text-brand-ink hover:underline"
          >
            Inicia sesión
          </Link>
          .
        </p>
      </div>
    );
  }

  const busy = pending || Boolean(state.success);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="username"
        name="username"
        label="Nombre de usuario"
        hint={USERNAME_RULES_HINT}
        autoComplete="username"
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_HTML_PATTERN}
        disabled={busy}
        placeholder="tu_nombre"
      />

      <AuthField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        hint="No se mostrará en tu perfil."
        autoComplete="email"
        required
        disabled={busy}
        placeholder="tu@correo.com"
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        hint="Al menos 6 caracteres."
        autoComplete="new-password"
        required
        minLength={6}
        disabled={busy}
      />

      <AuthField
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        label="Repite la contraseña"
        autoComplete="new-password"
        required
        minLength={6}
        disabled={busy}
      />

      <fieldset className="flex flex-col gap-3 rounded-control border border-line bg-canvas px-3.5 py-3">
        <legend className="sr-only">Condiciones para crear la cuenta</legend>

        <div className="flex flex-col gap-1">
          <label htmlFor={AGE_CONFIRMATION_FIELD} className="flex cursor-pointer items-start gap-2.5 text-dense leading-5 text-fg">
            <input
              id={AGE_CONFIRMATION_FIELD}
              name={AGE_CONFIRMATION_FIELD}
              type="checkbox"
              required
              checked={confirmedAge}
              onChange={(event) => setConfirmedAge(event.target.checked)}
              disabled={busy}
              aria-describedby="confirmAgeHint"
              className="focus-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-brand-500"
            />
            <span>Confirmo que tengo 14 años o más.</span>
          </label>
          {/* Sangría = casilla (1rem) + separación (0.625rem): alinea con el texto de la casilla. */}
          <p id="confirmAgeHint" className="pl-[1.625rem] text-label leading-5 text-fg-muted">
            Actualmente, BytePath permite crear cuentas directamente a personas de 14 años o más. Si eres
            menor de 14 años, consulta con tu madre, padre o tutor.
          </p>
        </div>

        <label htmlFor={TERMS_ACCEPTANCE_FIELD} className="flex cursor-pointer items-start gap-2.5 border-t border-line pt-3 text-dense leading-5 text-fg">
          <input
            id={TERMS_ACCEPTANCE_FIELD}
            name={TERMS_ACCEPTANCE_FIELD}
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            disabled={busy}
            className="focus-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-brand-500"
          />
          <span>
            He leído y acepto los{" "}
            {/* En otra pestaña: salir de aquí para leerlos borraría lo ya escrito. */}
            <Link href={routes.terms} target="_blank" rel="noopener" className="focus-ring rounded-control font-medium text-brand-ink underline-offset-2 hover:underline">
              {legalDocuments.terms.title}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </Link>{" "}
            de BytePath.
          </span>
        </label>
        {/* Qué versión se está aceptando: la que se enseñó al cargar el formulario. */}
        <input type="hidden" name="termsVersion" value={TERMS_VERSION} />
      </fieldset>

      <AuthMessage error={state.error} success={state.success} />

      <SubmitButton pending={busy} pendingLabel="Creando cuenta…" disabled={!confirmedAge || !acceptedTerms}>
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
