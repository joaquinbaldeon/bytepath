"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { useSubmitKeepingValues } from "@/components/auth/useSubmitKeepingValues";
import { signInAction } from "@/lib/auth/actions";
import { emptyAuthState } from "@/lib/auth/form-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { routes } from "@/lib/site";

export function LoginForm({
  initialError,
  initialNotice,
}: {
  initialError?: string;
  initialNotice?: string;
}) {
  const [state, formAction, pending] = useActionState(signInAction, emptyAuthState);
  const router = useRouter();

  // El enlace de confirmación caducado, o la salida de sesión, redirigen aquí
  // con su motivo. En cuanto el formulario produce su propia respuesta, manda
  // esa y el mensaje de llegada desaparece.
  const touched = Boolean(state.error || state.notice || state.success);
  const error = state.error ?? (touched ? null : initialError || null);
  const notice = state.notice ?? (touched ? null : initialNotice || null);

  // Un error de acceso conserva el correo escrito; solo se vacía la contraseña.
  const { formRef, onSubmit } = useSubmitKeepingValues(formAction, state.error);

  useEffect(() => {
    if (!state.success) return;

    let cancelled = false;

    async function enter() {
      // La sesión la abrió el servidor y escribió sus cookies. El cliente de
      // Supabase del navegador todavía tiene su estado anterior en memoria,
      // así que se le pide que relea las cookies: eso dispara
      // `onAuthStateChange` y la barra de navegación se entera al instante,
      // sin recargar la página a mano.
      try {
        await createSupabaseBrowserClient().auth.getSession();
      } catch {
        // Si fallara, la barra se resincroniza igualmente al cambiar de ruta.
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

  // Tras el acierto el botón sigue bloqueado: la navegación ya está en marcha.
  const busy = pending || Boolean(state.success);

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className="flex flex-col gap-4">
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
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
        autoComplete="current-password"
        required
        disabled={busy}
      />

      <p className="-mt-2 text-right text-label">
        <Link
          href={routes.passwordReset}
          className="focus-ring rounded-control font-medium text-brand-ink hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <AuthMessage error={error} notice={notice} success={state.success} />

      <SubmitButton pending={busy} pendingLabel="Iniciando sesión…">
        Entrar
      </SubmitButton>
    </form>
  );
}
