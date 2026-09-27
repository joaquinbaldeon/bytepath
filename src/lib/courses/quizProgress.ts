/**
 * Instantánea persistible de un quiz en curso.
 *
 * Es lo MÍNIMO que hace falta para continuar "desde donde quedó": el orden
 * barajado de este intento, qué preguntas quedan en la ronda actual y cuáles
 * se han fallado (van a la siguiente), y el resultado de las ya respondidas.
 *
 * Deliberadamente NO se guarda: qué opción marcó el estudiante, el orden de
 * las opciones, los textos ni las respuestas correctas. Nada de eso hace
 * falta para continuar y todo se puede recalcular del contenido.
 *
 * Este módulo es puro (sin React, sin servidor) porque lo usan los dos lados:
 * el cliente para construir y restaurar la instantánea, y el servidor para
 * validarla contra el contenido real del quiz antes de guardarla y al leerla.
 * La base de datos solo acota tipo y tamaño (`progress.sql`); no conoce las
 * preguntas, así que esa validación fina ocurre aquí.
 */

export type QuizQuestionResult = {
  solved: boolean;
  /** Se ha fallado al menos una vez, en cualquier ronda. Nunca se revierte. */
  failed: boolean;
};

export type QuizSnapshot = {
  v: 1;
  order: string[];
  currentRound: string[];
  nextRound: string[];
  roundNumber: number;
  roundTotal: number;
  results: Record<string, QuizQuestionResult>;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function hasDuplicates(items: string[]): boolean {
  return new Set(items).size !== items.length;
}

/**
 * Valida una instantánea contra los identificadores de pregunta REALES del
 * quiz. Devuelve la instantánea normalizada o `null` si no es válida.
 *
 * Es estricta a propósito: se usa tanto para aceptar lo que manda el
 * navegador como para leer lo guardado. Una instantánea que no cuadra con el
 * quiz actual (por ejemplo, porque se reescribió el contenido y cambiaron los
 * identificadores) no se intenta reparar: se descarta y el quiz empieza de
 * cero, que es lo seguro.
 */
export function parseQuizSnapshot(raw: unknown, questionIds: readonly string[]): QuizSnapshot | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as Record<string, unknown>;

  if (value.v !== 1) return null;
  if (!isStringArray(value.order) || !isStringArray(value.currentRound) || !isStringArray(value.nextRound)) {
    return null;
  }

  const known = new Set(questionIds);
  const { order, currentRound, nextRound } = value as {
    order: string[];
    currentRound: string[];
    nextRound: string[];
  };

  // El orden es una permutación exacta de las preguntas del quiz.
  if (order.length !== questionIds.length || hasDuplicates(order) || !order.every((id) => known.has(id))) {
    return null;
  }

  for (const round of [currentRound, nextRound]) {
    if (round.length > questionIds.length || hasDuplicates(round) || !round.every((id) => known.has(id))) {
      return null;
    }
  }
  if (currentRound.some((id) => nextRound.includes(id))) return null;

  const { roundNumber, roundTotal } = value;
  if (!Number.isInteger(roundNumber) || (roundNumber as number) < 1 || (roundNumber as number) > 50) return null;
  if (!Number.isInteger(roundTotal) || (roundTotal as number) < 0 || (roundTotal as number) > questionIds.length) {
    return null;
  }

  if (typeof value.results !== "object" || value.results === null || Array.isArray(value.results)) return null;
  const results: Record<string, QuizQuestionResult> = {};
  for (const [id, result] of Object.entries(value.results as Record<string, unknown>)) {
    if (!known.has(id) || typeof result !== "object" || result === null) return null;
    const { solved, failed } = result as Record<string, unknown>;
    if (typeof solved !== "boolean" || typeof failed !== "boolean") return null;
    results[id] = { solved, failed };
  }

  return {
    v: 1,
    order,
    currentRound,
    nextRound,
    roundNumber: roundNumber as number,
    roundTotal: roundTotal as number,
    results,
  };
}

/** Preguntas ya resueltas: es lo que dice "Pregunta 4 de 6" al volver. */
export function countSolved(snapshot: QuizSnapshot): number {
  return Object.values(snapshot.results).filter((result) => result.solved).length;
}

/**
 * Pone la instantánea de acuerdo con lo que el SERVIDOR sabe.
 *
 * La instantánea la guarda el navegador al pasar de pregunta; las respuestas
 * acertadas (`solvedIds`) las anota el servidor en el momento de corregir. Las
 * dos pueden ir desfasadas —se cerró la pestaña entre "Comprobar" y
 * "Siguiente"— y, si no coinciden, manda el servidor: un acierto que solo
 * existe en la instantánea no cuenta, y uno que solo existe en el servidor sí.
 *
 * Nunca se pierde una pregunta: una sin resolver que no esté en ninguna ronda
 * se añade a la siguiente. Devuelve `null` si no hay nada que continuar.
 */
export function reconcileSnapshot(
  snapshot: QuizSnapshot | null,
  solvedIds: readonly string[],
  questionIds: readonly string[],
): QuizSnapshot | null {
  const solved = new Set(solvedIds.filter((id) => questionIds.includes(id)));
  if (!snapshot && solved.size === 0) return null;

  const order = snapshot ? snapshot.order : [...questionIds];
  const results: QuizSnapshot["results"] = {};
  for (const id of questionIds) {
    const failed = snapshot?.results[id]?.failed ?? false;
    if (solved.has(id) || failed) results[id] = { solved: solved.has(id), failed };
  }

  const unsolved = (id: string) => !solved.has(id);
  const currentRound = (snapshot ? snapshot.currentRound : order).filter(unsolved);
  const nextRound = (snapshot ? snapshot.nextRound : []).filter(unsolved);
  for (const id of order) {
    if (unsolved(id) && !currentRound.includes(id) && !nextRound.includes(id)) nextRound.push(id);
  }

  return {
    v: 1,
    order,
    currentRound,
    nextRound,
    roundNumber: snapshot?.roundNumber ?? 1,
    roundTotal: snapshot ? Math.min(snapshot.roundTotal, questionIds.length) : currentRound.length,
    results,
  };
}
