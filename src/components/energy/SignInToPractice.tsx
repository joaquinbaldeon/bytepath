import { ArrowRight, BookOpen, Map as MapIcon, Zap } from "lucide-react";
import Link from "next/link";
import { FREE_MAX_ENERGY } from "@/lib/energy/config";
import { routes } from "@/lib/site";

/**
 * Lo que se ve al intentar entrar a una lección sin haber iniciado sesión.
 *
 * Las lecciones necesitan una cuenta porque es donde se guarda el progreso —qué
 * has completado, qué lección toca ahora—, la energía que se gasta al completar
 * y los tokens que se ganan. Lo que sí sigue abierto es el camino del curso, para
 * que se vea qué hay antes de decidir registrarse; por eso el texto ofrece
 * volver a él.
 */
export function SignInToPractice({ coursePath }: { coursePath: string }) {
  return (
    <div className="w-full max-w-sm text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-panel bg-brand-soft">
        <BookOpen aria-hidden className="size-6 text-brand-ink" />
      </span>

      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">
        Entra para empezar esta lección
      </h2>

      <p className="mt-2.5 text-body text-fg-muted">
        Las lecciones necesitan una cuenta: es donde se guardan tu progreso, tu energía y tus
        tokens. El camino del curso sigue abierto para que veas qué te espera.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={routes.login}
          className="focus-ring group inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-500 font-medium text-white transition-colors hover:bg-brand-600"
        >
          Iniciar sesión
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        <Link
          href={routes.signup}
          className="focus-ring inline-flex h-11 items-center justify-center rounded-control border border-line font-medium transition-colors hover:bg-surface-2"
        >
          Crear una cuenta gratis
        </Link>

        <Link
          href={coursePath}
          className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-control text-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <MapIcon aria-hidden className="size-4" />
          Ver el camino del curso
        </Link>
      </div>

      <p className="mt-5 inline-flex items-center justify-center gap-1.5 text-dense leading-6 text-fg-subtle">
        <Zap aria-hidden className="size-3.5 shrink-0 fill-energy text-energy" />
        Hasta {FREE_MAX_ENERGY} energías a la vez, sin pagar nada.
      </p>
    </div>
  );
}
