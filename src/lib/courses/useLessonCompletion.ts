"use client";

import { useCallback, useRef, useState } from "react";
import { completeLessonAction } from "@/lib/courses/actions";
import type { CompleteRejectReason } from "@/lib/courses/outcomes";
import { publishAccountState } from "@/lib/energy/store";

/**
 * Completar una lección desde el navegador.
 *
 * Es solo el cliente de `completeLessonAction`: manda la petición, refleja el
 * resultado y lo deja a mano de la interfaz. No decide nada —ni si la lección
 * cumple los requisitos, ni si hay energía, ni cuánto se paga—: eso lo decide
 * la base de datos, y este hook enseña el veredicto.
 *
 * Lo que sí hace es no pedir lo mismo dos veces: una guarda síncrona ignora un
 * segundo clic antes de que React llegue a deshabilitar el botón. Es una
 * comodidad —doble clic, dos pestañas o dos peticiones simultáneas terminan
 * igual en el servidor: una finaliza, las demás reciben `already_completed`—.
 */

export type CompletionFeedback = {
  /** Tokens que ha pagado ESTA finalización. */
  amount: number;
  /** Esta finalización ha gastado 1 ⚡ (falso en Premium). */
  spent: boolean;
};

export type LessonCompletion = {
  completed: boolean;
  pending: boolean;
  /** Lo ocurrido al completar en ESTA sesión; `null` si ya venía completada o aún no. */
  feedback: CompletionFeedback | null;
  /** Por qué el último intento no ha completado la lección, o `null`. */
  problem: CompleteRejectReason | null;
  /** Pide completar. Seguro de repetir. */
  complete: () => Promise<void>;
};

export function useLessonCompletion({
  courseSlug,
  lessonSlug,
  initialCompleted,
}: {
  courseSlug: string;
  lessonSlug: string;
  initialCompleted: boolean;
}): LessonCompletion {
  const inFlight = useRef(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<CompletionFeedback | null>(null);
  const [problem, setProblem] = useState<CompleteRejectReason | null>(null);

  const complete = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setProblem(null);

    try {
      const outcome = await completeLessonAction(courseSlug, lessonSlug);

      if (outcome.status === "completed") {
        setCompleted(true);
        publishAccountState(outcome.account);
        if (!outcome.alreadyCompleted) {
          setFeedback({ amount: outcome.amount, spent: outcome.spent });
        }
      } else if (outcome.status === "local") {
        // Sin Supabase no hay energía ni tokens: solo se marca en pantalla.
        setCompleted(true);
      } else {
        // La lección sigue EN PROGRESO. Si la energía es la causa, el servidor
        // devuelve su estado actual y con él se sabe cuándo vuelve la próxima.
        if (outcome.account) publishAccountState(outcome.account);
        setProblem(outcome.reason);
      }
    } catch {
      // Sin red no hay veredicto. Reintentar es seguro: completar es idempotente.
      setProblem("unavailable");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [courseSlug, lessonSlug]);

  return { completed, pending, feedback, problem, complete };
}
