import { createRemoteProvider } from "@/lib/execution/remote";
import type { ExecutionProvider } from "@/lib/execution/types";

/**
 * Único punto donde se decide cómo se ejecuta el código.
 *
 * Hoy siempre es la API de BytePath, que delega en Judge0. Si Judge0 no está
 * configurado, el servidor responde `unavailable`: **nunca se simula una
 * ejecución correcta**, porque dar por buena una solución sin haberla ejecutado
 * sería mentirle al estudiante.
 */
export function getExecutionProvider(): ExecutionProvider {
  return createRemoteProvider();
}
