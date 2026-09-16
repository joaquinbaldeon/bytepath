import "server-only";

/**
 * Casos de prueba y soluciones de referencia de los desafíos.
 *
 * Este módulo **nunca** debe llegar al navegador: `import "server-only"` hace
 * que importarlo desde un componente cliente sea un error de compilación, no un
 * descuido que se descubre en producción.
 *
 * Aquí viven los datos que el estudiante no debe ver. Lo que sí puede ver
 * —enunciado, ejemplos, código inicial— sigue en `src/content/courses`.
 */

export type ChallengeTest = {
  id: string;
  stdin?: string;
  expectedOutput: string;
  /**
   * Un caso oculto no devuelve al navegador ni su entrada ni su salida: solo
   * si pasó. Todavía no se usa, pero el filtrado ya está implementado.
   */
  hidden?: boolean;
};

export type ChallengeLimits = {
  cpuSeconds: number;
  wallSeconds: number;
  memoryMb: number;
};

export type ChallengeTestSuite = {
  tests: ChallengeTest[];
  limits: ChallengeLimits;
  /** Solución del autor. No se devuelve jamás. */
  solution?: string;
};

const defaultLimits: ChallengeLimits = {
  cpuSeconds: 2,
  wallSeconds: 6,
  memoryMb: 128,
};

const suites: Record<string, ChallengeTestSuite> = {
  "variables-desafio": {
    limits: defaultLimits,
    tests: [{ id: "caso-unico", expectedOutput: "17\n18" }],
    solution: [
      "#include <iostream>",
      "using namespace std;",
      "",
      "int main() {",
      "  int edad = 17;",
      "  int siguiente = edad + 1;",
      "",
      "  cout << edad << endl;",
      "  cout << siguiente << endl;",
      "",
      "  return 0;",
      "}",
    ].join("\n"),
  },
};

export function getTestSuite(challengeId: string): ChallengeTestSuite | undefined {
  return suites[challengeId];
}
