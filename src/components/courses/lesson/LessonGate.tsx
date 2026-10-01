"use client";

import { ArrowRight, DatabaseZap, Lock, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { SignInToPractice } from "@/components/energy/SignInToPractice";
import { actionClass } from "@/components/ui/actions";

export type LessonGateProps =
  | { status: "signin"; coursePath: string }
  | {
      status: "locked";
      coursePath: string;
      prerequisite: { title: string; href: string };
    }
  | {
      status: "unavailable";
      coursePath: string;
      /** Qué arreglar. Solo se rellena en desarrollo: en producción no se cuentan detalles de la infraestructura. */
      hint?: string;
    };

/**
 * Pantalla que sustituye a la lección cuando todavía no se puede leer.
 *
 * Es lo que ve alguien que llega por un enlace directo, un marcador o
 * escribiendo la URL —el camino ya resuelve todo esto antes de navegar—, y el
 * servidor la elige, no el navegador: si un cliente manipulado creyera tener
 * acceso, la página de la lección se pediría igualmente al servidor, que
 * volvería a decidir y devolvería esta pantalla en vez de la teoría.
 *
 * No incluye nada del contenido de la lección: ni la teoría ni el quiz llegan
 * al navegador mientras el acceso no esté concedido. Ninguna de estas pantallas
 * habla de energía: entrar a una lección no la cuesta.
 */
export function LessonGate(props: LessonGateProps) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-surface px-5 py-16 sm:px-8">
      {props.status === "signin" && <SignInToPractice coursePath={props.coursePath} />}
      {props.status === "locked" && <LockedCard {...props} />}
      {props.status === "unavailable" && (
        <UnavailableCard coursePath={props.coursePath} hint={props.hint} />
      )}
    </div>
  );
}

function LockedCard({
  coursePath,
  prerequisite,
}: {
  coursePath: string;
  prerequisite: { title: string; href: string };
}) {
  return (
    <div className="w-full max-w-sm text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-panel bg-surface-2">
        <Lock aria-hidden className="size-6 text-fg-subtle" />
      </span>

      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">
        Esta lección todavía no toca
      </h2>
      <p className="mt-2.5 text-body text-fg-muted">
        Se abre en cuanto completes «{prerequisite.title}». Vamos por orden: cada lección se apoya
        en la anterior.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link href={prerequisite.href} className={actionClass("primary")}>
          <span className="truncate">Ir a «{prerequisite.title}»</span>
          <ArrowRight aria-hidden className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href={coursePath} className={actionClass("secondary")}>
          <MapIcon aria-hidden className="size-4" />
          Volver al camino
        </Link>
      </div>
    </div>
  );
}

function UnavailableCard({ coursePath, hint }: { coursePath: string; hint?: string }) {
  return (
    <div className="w-full max-w-sm text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-panel bg-energy-soft">
        <DatabaseZap aria-hidden className="size-6 text-energy-ink" />
      </span>

      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">
        No se ha podido leer tu progreso
      </h2>
      <p className="mt-2.5 text-body text-fg-muted">
        Tu cuenta está bien, pero el servidor no consigue consultar tu avance ahora mismo. Inténtalo
        de nuevo en un momento.
      </p>
      {hint && (
        <p className="mt-3 rounded-control bg-energy-soft px-3 py-2 text-left text-dense leading-5 text-energy-ink">
          <span className="font-mono text-label tracking-wider uppercase">Solo en desarrollo · </span>
          {hint}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <Link
          href={coursePath}
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand-500 font-medium text-white transition-colors hover:bg-brand-600"
        >
          <MapIcon aria-hidden className="size-4" />
          Volver al camino
        </Link>
      </div>
    </div>
  );
}
