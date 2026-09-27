"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EnergyMeter } from "@/components/energy/EnergyMeter";
import { TokenBadge } from "@/components/tokens/TokenBadge";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/auth/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { routes } from "@/lib/site";

/**
 * Zona de cuenta de la barra de navegación.
 *
 * Resuelve la sesión en el cliente a propósito. La alternativa —leerla en el
 * layout del servidor— obligaría a renderizar bajo demanda todas las páginas,
 * y BytePath prerenderiza estáticamente las de cursos y lecciones. Aquí se
 * paga un parpadeo muy breve en la barra a cambio de conservar eso.
 *
 * Se resincroniza por dos vías:
 *   · `onAuthStateChange`, para los cambios que ocurren en el navegador;
 *   · el cambio de ruta, porque el acceso ocurre en una Server Action y el
 *     cliente no se entera por sí solo de una sesión que abrió el servidor.
 *
 * Nunca muestra el correo: el nombre público es el username.
 */

type State =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; username: string };

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [state, setState] = useState<State>(
    // Sin Supabase configurado no hay sesión posible: se muestran los enlaces
    // de siempre en vez de quedarse cargando para siempre.
    isSupabaseConfigured() ? { status: "loading" } : { status: "signedOut" },
  );
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  const sync = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ status: "signedOut" });
      return;
    }

    const supabase = createSupabaseBrowserClient();

    // El username vive en `profiles`, que es la única fuente de verdad. Los
    // metadatos del registro (user_metadata) ya no se leen: se quedan
    // desactualizados si el nombre cambia. Si la consulta falla, la barra dice
    // "Tu cuenta": hay sesión, aunque no se sepa el nombre ahora mismo.
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    setState({ status: "signedIn", username: profile?.username ?? "Tu cuenta" });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();

    // Al suscribirse, Supabase emite `INITIAL_SESSION` con lo que haya
    // guardado, así que la lectura inicial y los cambios posteriores llegan
    // por el mismo camino.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void sync(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
    // `pathname` está en las dependencias para rehacer la suscripción al
    // navegar: esa nueva `INITIAL_SESSION` es la que refleja en la barra un
    // acceso que ocurrió en el servidor, del que el cliente no se entera solo.
  }, [sync, pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    onNavigate?.();

    try {
      // Cierre en el navegador: revoca el token en Supabase, borra las cookies
      // y limpia el estado en memoria del cliente. Dispara
      // `onAuthStateChange`, así que la barra cambia en el acto.
      await createSupabaseBrowserClient().auth.signOut();
    } catch {
      // Aunque falle, la Server Action de abajo cierra igualmente.
    }

    // Cierre en el servidor y redirección. Deja la sesión cerrada también
    // para el renderizado de servidor, no solo para esta pestaña.
    await signOutAction();
  }

  if (state.status === "loading") {
    // Reserva el hueco para que la barra no dé un salto al resolverse.
    return <div aria-hidden className="h-10 w-44" />;
  }

  if (state.status === "signedIn") {
    return (
      <div className="flex items-center gap-1.5">
        {/* El medidor y el saldo se pintan solos si hay algo que mostrar:
            cada uno resuelve su propio estado y devuelve null sin sesión. */}
        <EnergyMeter />
        <TokenBadge />

        <Link
          href={routes.courses}
          onClick={onNavigate}
          title={`Sesión iniciada como ${state.username}`}
          className="focus-ring flex items-center gap-2 rounded-control px-2.5 py-2 text-sm text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-[11px] font-semibold text-white uppercase"
          >
            {state.username.slice(0, 1)}
          </span>
          <span className="max-w-32 truncate font-medium">{state.username}</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-control border border-white/15 px-3 text-sm text-slate-200 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut aria-hidden className="size-3.5" />
          {signingOut ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={routes.login}
        onClick={onNavigate}
        className="focus-ring rounded-control px-3 py-2 text-sm text-slate-300 transition-colors hover:text-white"
      >
        Iniciar sesión
      </Link>
      <Button href={routes.signup} onClick={onNavigate}>
        Registrarse
      </Button>
    </div>
  );
}
