"use server";

import { revalidatePath } from "next/cache";
import { coursePath, getCourse, getLesson } from "@/lib/courses/api";
import type {
  CompleteOutcome,
  CompleteRejectReason,
  QuizAnswerOutcome,
  RejectReason,
  StartOutcome,
} from "@/lib/courses/outcomes";
import type { QuizStatus } from "@/lib/courses/progress";
import { parseQuizSnapshot } from "@/lib/courses/quizProgress";
import {
  callWriter,
  ensureStarted,
  prerequisiteSlug,
  resolveWriter,
  type Writer,
} from "@/lib/courses/writer";
import { type RawAccount, toAccountState } from "@/lib/energy/server";
import {
  consumeUserLimit,
  type LimitRule,
  PROGRESS_ACTION_LIMIT,
  QUIZ_ANSWER_LIMIT,
} from "@/lib/security/rateLimit";

/**
 * Acciones de servidor del recorrido de una lección.
 *
 * Toda Server Action es un endpoint público —cualquiera puede enviarle el
 * mismo POST sin pasar por la interfaz—, así que aquí no se confía en nada de
 * lo que llega:
 *
 *   · Quién eres lo dice la cookie de sesión, nunca un parámetro (`writer.ts`).
 *   · Curso, lección y pregunta son solo referencias, y se comprueban contra el
 *     contenido real antes de tocar nada.
 *   · Qué exige cada lección (quiz, desafío, lección anterior) lo dice el
 *     contenido, aquí, y se pasa a la base de datos. El navegador no aporta
 *     ningún requisito.
 *   · La base de datos vuelve a validarlo todo en la misma transacción que
 *     escribe: aunque alguien se saltara esta capa, las funciones SQL no son
 *     ejecutables con la sesión de un estudiante.
 */

type Located = {
  course: NonNullable<ReturnType<typeof getCourse>>;
  lesson: NonNullable<ReturnType<typeof getLesson>>["lesson"];
};

function locate(courseSlug: unknown, lessonSlug: unknown): Located | null {
  if (typeof courseSlug !== "string" || typeof lessonSlug !== "string") return null;
  const course = getCourse(courseSlug);
  const context = course && getLesson(course, lessonSlug);
  return course && context ? { course, lesson: context.lesson } : null;
}

function writerRejection(writer: Writer): RejectReason {
  return writer.status === "not_signed_in" ? "not_signed_in" : "unavailable";
}

/**
 * Cupo por usuario (el id sale de la sesión, no de un parámetro). `true` si
 * esta cuenta ha superado el límite. Sin Supabase (`local`) no hay cupo.
 */
async function overLimit(writer: Writer, rule: LimitRule): Promise<boolean> {
  if (writer.status !== "ready") return false;
  return (await consumeUserLimit(rule, writer.userId)).status === "limited";
}

/**
 * Empezar una lección: la deja EN PROGRESO. Es gratis —no toca la energía— y
 * se puede repetir todas las veces que haga falta.
 */
export async function startLessonAction(
  courseSlug: string,
  lessonSlug: string,
): Promise<StartOutcome> {
  const located = locate(courseSlug, lessonSlug);
  if (!located) return { status: "rejected", reason: "not_found" };

  const writer = await resolveWriter();
  if (writer.status === "local") return { status: "local" };
  if (writer.status !== "ready") return { status: "rejected", reason: writerRejection(writer) };
  if (await overLimit(writer, PROGRESS_ACTION_LIMIT)) return { status: "rejected", reason: "rate_limited" };

  const result = await ensureStarted(writer, located.course, located.lesson.slug);
  return result === "ok" ? { status: "started" } : { status: "rejected", reason: result };
}

/**
 * Corrige UNA pregunta del quiz.
 *
 * La respuesta correcta no sale nunca del servidor: el navegador manda qué
 * opción marcó y recibe solo "acierto" o "fallo" (y la explicación, si acertó).
 * Es el servidor quien anota el acierto, y es ese registro —no lo que el
 * navegador diga— lo que más tarde exige `complete_lesson` para dar el quiz
 * por superado.
 *
 * Corregir revela la respuesta (quien acierta sabe cuál era y recibe la
 * explicación), así que antes de mirar la pregunta se comprueba, en este orden:
 *
 *   1. quién pregunta: la cookie de sesión (`resolveWriter`). Sin sesión, se
 *      rechaza sin mirar el contenido: la respuesta es la misma exista o no
 *      la lección. Con sesión, se consume su cupo de respuestas (30 por
 *      minuto, por cuenta): repetir en masa no sirve;
 *   2. que curso y lección existan en el contenido y la lección tenga quiz;
 *   3. que la lección esté desbloqueada para ESE usuario: `ensureStarted`
 *      pregunta a la base de datos (`start_lesson`), que exige la lección
 *      anterior completada. Una lección bloqueada responde `locked` sin llegar
 *      a mirar qué pregunta ni qué opción se enviaron;
 *   4. solo entonces, que la pregunta sea de ESE quiz y la opción de ESA
 *      pregunta. Los slugs y el id de la pregunta son referencias para buscar
 *      en el contenido, nunca una prueba de acceso.
 *
 * La única excepción es un proyecto sin Supabase (`local`): no hay cuentas y
 * todas las lecciones están abiertas a cualquiera (`resolveLessonAccess`), así
 * que se corrige sin anotar.
 */
export async function checkQuizAnswerAction(
  courseSlug: string,
  lessonSlug: string,
  questionId: string,
  optionId: string,
): Promise<QuizAnswerOutcome> {
  const writer = await resolveWriter();
  if (writer.status === "not_signed_in" || writer.status === "unavailable") {
    return { status: "rejected", reason: writerRejection(writer) };
  }
  if (await overLimit(writer, QUIZ_ANSWER_LIMIT)) return { status: "rejected", reason: "rate_limited" };

  const located = locate(courseSlug, lessonSlug);
  const quiz = located?.lesson.quiz;
  if (!located || !quiz) return { status: "rejected", reason: "not_found" };

  if (writer.status === "ready") {
    const started = await ensureStarted(writer, located.course, located.lesson.slug);
    if (started !== "ok") return { status: "rejected", reason: started };
  }

  const question =
    typeof questionId === "string" ? quiz.questions.find((candidate) => candidate.id === questionId) : undefined;
  if (!question || typeof optionId !== "string" || !question.options.some((option) => option.id === optionId)) {
    return { status: "rejected", reason: "not_found" };
  }

  const correct = optionId === question.correctOptionId;
  const explanation = correct ? question.explanation : undefined;

  // Aquí solo puede quedar `local` (sin Supabase): se corrige sin anotar.
  if (writer.status !== "ready") {
    return { status: "graded", correct, explanation, quizStatus: "in_progress", recorded: false };
  }

  const result = await callWriter<{ recorded: boolean; reason?: string; quiz_status?: QuizStatus }>(
    writer,
    "record_quiz_answer",
    {
      p_course: located.course.slug,
      p_lesson: located.lesson.slug,
      p_question: question.id,
      p_correct: correct,
      p_questions: quiz.questions.map((candidate) => candidate.id),
    },
  );

  // Si no se ha podido anotar, NO se da por buena la respuesta: seguir adelante
  // dejaría el quiz "terminado" en pantalla y sin constancia en el servidor, y
  // completar la lección fallaría después sin explicación.
  if (!result) return { status: "rejected", reason: "unavailable" };

  return {
    status: "graded",
    correct,
    explanation,
    quizStatus: result.quiz_status ?? "in_progress",
    // Repasar el quiz de una lección ya completada corrige, pero no anota.
    recorded: result.recorded,
  };
}

/**
 * Guarda el punto del quiz para continuar donde se dejó. Devuelve
 * `saved: false` —sin error— cuando no toca guardar (sin sesión, lección ya
 * completada...): que el punto no se pueda guardar nunca debe romper el quiz.
 */
export async function saveQuizProgressAction(
  courseSlug: string,
  lessonSlug: string,
  snapshot: unknown,
): Promise<{ saved: boolean }> {
  const located = locate(courseSlug, lessonSlug);
  const quiz = located?.lesson.quiz;
  if (!located || !quiz) return { saved: false };

  // Se valida contra las preguntas reales de ESTA lección. `parseQuizSnapshot`
  // devuelve una copia normalizada: es esa —no lo que mandó el navegador— la
  // que llega a la base de datos.
  const valid = parseQuizSnapshot(snapshot, quiz.questions.map((question) => question.id));
  if (!valid) return { saved: false };

  const writer = await resolveWriter();
  if (writer.status !== "ready") return { saved: false };
  if (await overLimit(writer, PROGRESS_ACTION_LIMIT)) return { saved: false };

  if ((await ensureStarted(writer, located.course, located.lesson.slug)) !== "ok") return { saved: false };

  const result = await callWriter<{ saved: boolean }>(writer, "save_quiz_state", {
    p_course: located.course.slug,
    p_lesson: located.lesson.slug,
    p_state: valid,
  });
  return { saved: result?.saved === true };
}

/** Descarta un quiz en curso para empezarlo de cero. No toca la energía ni un quiz ya superado. */
export async function resetQuizProgressAction(
  courseSlug: string,
  lessonSlug: string,
): Promise<{ saved: boolean }> {
  const located = locate(courseSlug, lessonSlug);
  if (!located) return { saved: false };

  const writer = await resolveWriter();
  if (writer.status !== "ready") return { saved: false };
  if (await overLimit(writer, PROGRESS_ACTION_LIMIT)) return { saved: false };

  const result = await callWriter<{ reset: boolean }>(writer, "reset_quiz_progress", {
    p_course: located.course.slug,
    p_lesson: located.lesson.slug,
  });
  return { saved: result?.reset === true };
}

type RawComplete = RawAccount & {
  completed: boolean;
  awarded: boolean;
  spent: boolean;
  amount: number;
  tokens: number;
  reason: string | null;
};

const knownRejections = new Set<string>([
  "not_started",
  "locked",
  "quiz_pending",
  "challenge_pending",
  "no_energy",
]);

/**
 * Completa una lección: el ÚNICO sitio donde se gasta energía.
 *
 * Todo lo que importa ocurre dentro de `complete_lesson`, en una sola
 * transacción con las filas bloqueadas: comprobar que la lección anterior está
 * completada y que el quiz y el desafío (si los hay) están superados según el
 * servidor, gastar 1 ⚡ (salvo Premium), pagar +10 tokens una sola vez, marcar
 * `completed_at`. Esta acción solo dice qué exige el contenido y traduce la
 * respuesta.
 *
 * Doble clic, dos pestañas o dos peticiones a la vez terminan igual: una
 * finaliza y las demás reciben `already_completed`.
 */
export async function completeLessonAction(
  courseSlug: string,
  lessonSlug: string,
): Promise<CompleteOutcome> {
  const located = locate(courseSlug, lessonSlug);
  if (!located) return { status: "rejected", reason: "not_found", account: null };

  const writer = await resolveWriter();
  if (writer.status === "local") return { status: "local" };
  if (writer.status !== "ready") {
    return { status: "rejected", reason: writerRejection(writer), account: null };
  }
  if (await overLimit(writer, PROGRESS_ACTION_LIMIT)) {
    return { status: "rejected", reason: "rate_limited", account: null };
  }

  const started = await ensureStarted(writer, located.course, located.lesson.slug);
  if (started !== "ok") return { status: "rejected", reason: started, account: null };

  const raw = await callWriter<RawComplete>(writer, "complete_lesson", {
    p_course: located.course.slug,
    p_lesson: located.lesson.slug,
    p_prerequisite: prerequisiteSlug(located.course, located.lesson.slug),
    p_needs_quiz: located.lesson.quiz !== null,
    p_needs_challenge: located.lesson.challenge !== null,
  });
  if (!raw) return { status: "rejected", reason: "unavailable", account: null };

  const account = toAccountState(raw);

  if (raw.completed) {
    // Que el camino, el índice lateral y la barra reflejen lo nuevo.
    revalidatePath(coursePath(located.course.slug), "layout");

    return {
      status: "completed",
      awarded: raw.awarded,
      spent: raw.spent,
      amount: raw.amount,
      alreadyCompleted: raw.reason === "already_completed",
      account,
    };
  }

  const reason: CompleteRejectReason =
    raw.reason && knownRejections.has(raw.reason) ? (raw.reason as CompleteRejectReason) : "unavailable";
  return { status: "rejected", reason, account };
}
