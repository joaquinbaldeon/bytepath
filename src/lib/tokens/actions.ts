"use server";

import { refillEnergyWithTokens } from "@/lib/tokens/server";
import type { RefillOutcome } from "@/lib/tokens/types";

/**
 * Cambia 100 tokens por energía llena. Sin parámetros: no hay nada que el
 * cliente pueda decidir aquí.
 *
 * Completar una lección —y con ello gastar energía y cobrar los +10 tokens—
 * vive en `src/lib/courses/actions.ts` (`completeLessonAction`): es una sola
 * operación atómica en la base de datos, no dos.
 */
export async function refillEnergyAction(): Promise<RefillOutcome> {
  return refillEnergyWithTokens();
}
