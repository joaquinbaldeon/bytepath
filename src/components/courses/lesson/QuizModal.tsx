"use client";

import { ListChecks, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal del quiz.
 *
 * Usa el elemento `<dialog>` nativo con `showModal()` en vez de una librería o
 * un `div` con `position: fixed`, porque el navegador ya resuelve gratis lo
 * difícil de un modal accesible: atrapa el foco dentro, devuelve el foco a
 * quien lo abrió al cerrarse, cierra con Escape y deja inerte lo que hay
 * debajo para los lectores de pantalla. Cero dependencias nuevas.
 *
 * El contenido solo se monta mientras está abierto. Así cada apertura es un
 * intento nuevo del quiz (que además baraja al montarse) y el modal cerrado no
 * cuesta nada.
 *
 * Se puede abandonar de tres formas —la X, Escape o pulsar fuera— y las tres
 * llegan a `onClose`. Abandonar nunca pierde el avance: el quiz ya lo ha ido
 * guardando pregunta a pregunta.
 */
export function QuizModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Con el modal abierto la página de debajo no debe desplazarse.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="quiz-modal-title"
      // El evento "close" también salta cuando se cierra desde el `open` de
      // arriba; solo cuenta si el cierre viene de dentro (Escape).
      onClose={() => {
        if (open) onClose();
      }}
      // Un clic sobre el fondo oscuro tiene como destino el propio <dialog>,
      // porque su contenido lo cubre entero.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="bp-modal m-auto w-[calc(100%-1.5rem)] max-w-[46rem] overflow-hidden rounded-panel border border-line bg-surface p-0 text-fg shadow-card"
    >
      {open && (
        <div className="bp-modal-body flex max-h-[min(92dvh,54rem)] flex-col">
          <header className="flex shrink-0 items-center gap-3.5 border-b border-line px-5 py-3.5 sm:gap-4 sm:px-8 sm:py-5">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-control bg-learn-soft sm:size-10">
              <ListChecks className="size-4.5 text-learn-ink sm:size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-label tracking-wider text-fg-subtle uppercase">Quiz</p>
              <h2 id="quiz-modal-title" className="truncate font-display text-base font-semibold sm:text-lg">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Salir del quiz"
              className="focus-ring grid size-10 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X aria-hidden className="size-4.5" />
            </button>
          </header>

          {children}
        </div>
      )}
    </dialog>
  );
}
