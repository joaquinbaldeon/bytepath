import { ArrowRight, Clock, Play } from "lucide-react";
import Link from "next/link";
import { actionClass } from "@/components/ui/actions";
import { ProgressBar } from "@/components/ui/ProgressBar";

/**
 * "Tu siguiente paso": la respuesta a "¿qué hago ahora?" en la parte de arriba
 * de la página, no en un raíl lateral. Nombra el curso y la lección concreta
 * a la que lleva el botón, para que pulsarlo no sea un salto a ciegas.
 */
export function NextStepCard({
  started,
  courseTitle,
  lessonTitle,
  lessonMinutes,
  href,
  completed,
  total,
  percent,
}: {
  /** Hay progreso en este curso: se "sigue", no se "empieza". */
  started: boolean;
  courseTitle: string;
  lessonTitle: string;
  lessonMinutes: number;
  href: string;
  completed: number;
  total: number;
  percent: number;
}) {
  return (
    <section
      aria-label="Tu siguiente paso"
      className="relative overflow-hidden rounded-panel border border-brand-400/35 bg-surface p-5 shadow-soft sm:p-6"
    >
      {/* Un único adorno: el halo violeta de la esquina, como el de la marca. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-brand-500/15 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-label text-brand-ink">
            {started ? "// sigue donde lo dejaste" : "// empieza por aquí"}
          </p>
          <p className="mt-2 text-dense text-fg-muted">{courseTitle}</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {lessonTitle}
          </h2>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-dense text-fg-muted">
            <Clock aria-hidden className="size-3.5 text-fg-subtle" />
            {lessonMinutes} min
            {started && (
              <>
                <span aria-hidden className="text-fg-subtle">
                  ·
                </span>
                {completed > 0 ? `llevas ${completed} de ${total} lecciones` : "ya la tienes abierta"}
              </>
            )}
          </p>
          {completed > 0 && (
            <ProgressBar value={percent} className="mt-3 max-w-xs" label={`Progreso de ${courseTitle}`} />
          )}
        </div>

        <Link href={href} className={`${actionClass("primary", "lg")} shrink-0`}>
          <Play aria-hidden className="size-4 fill-current" />
          {started ? "Continuar" : "Empezar"}
          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
