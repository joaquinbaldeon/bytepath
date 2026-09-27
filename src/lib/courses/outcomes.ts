import type { QuizStatus } from "@/lib/courses/progress";
import type { AccountState } from "@/lib/energy/types";

/**
 * Lo que devuelven las acciones de servidor del recorrido de una lección.
 *
 * Solo tipos: los importan el servidor y el cliente. Todo son veredictos ya
 * decididos; el navegador los muestra, no los recalcula.
 */

/** Por qué una acción no ha podido hacerse. */
export type RejectReason =
  | "not_signed_in"
  | "not_found"
  /** Falta completar la lección anterior. */
  | "locked"
  /**
   * El servidor no puede guardar ahora mismo: falta `SUPABASE_SERVICE_ROLE_KEY`,
   * o los SQL de `supabase/` no están aplicados, o Supabase no responde. Se dice
   * tal cual; nunca se simula que ha funcionado.
   */
  | "unavailable"
  /** Demasiadas acciones seguidas de esta cuenta: hay que esperar un momento. */
  | "rate_limited";

export type StartOutcome =
  | { status: "started" }
  /** Sin Supabase configurado: no hay dónde guardar progreso, la lección se usa sin memoria. */
  | { status: "local" }
  | { status: "rejected"; reason: RejectReason };

export type QuizAnswerOutcome =
  | {
      status: "graded";
      correct: boolean;
      /** Solo si ha acertado: no se regala la explicación —ni la respuesta— a quien falla. */
      explanation?: string;
      quizStatus: QuizStatus;
      /** El servidor lo ha anotado (falso solo cuando no hay cuenta donde anotarlo). */
      recorded: boolean;
    }
  | { status: "rejected"; reason: RejectReason };

export type CompleteRejectReason =
  | RejectReason
  /** La lección no está iniciada (no hay fila de progreso). */
  | "not_started"
  | "quiz_pending"
  | "challenge_pending"
  /** Cuenta Free con 0 ⚡: la lección sigue EN PROGRESO y se completa cuando vuelva 1. */
  | "no_energy";

export type CompleteOutcome =
  | {
      status: "completed";
      /** Esta llamada ha entregado los tokens. Falso si la lección ya estaba completada. */
      awarded: boolean;
      /** Esta llamada ha gastado 1 ⚡. Falso en Premium y al repetir. */
      spent: boolean;
      amount: number;
      /** La lección ya estaba completada antes de esta llamada. */
      alreadyCompleted: boolean;
      account: AccountState;
    }
  | {
      status: "rejected";
      reason: CompleteRejectReason;
      /** Estado de la cuenta tal como lo ve ahora el servidor (para pintar cuándo vuelve la energía). */
      account: AccountState | null;
    }
  /** Sin Supabase configurado: no hay energía ni tokens, la lección se marca solo en pantalla. */
  | { status: "local" };

