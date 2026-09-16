/** Veredicto de un envío completo. Lo decide siempre el servidor. */
export type RunStatus =
  | "passed"
  | "failed"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "memory_limit"
  | "output_limit"
  | "unavailable"
  | "internal_error";

/** Resultado de un caso de prueba concreto. */
export type TestStatus =
  | "ok"
  | "wrong_output"
  | "runtime_error"
  | "timeout"
  | "memory_limit"
  | "output_limit"
  | "internal_error";

export type TestOutcome = {
  /** Posición del caso dentro del desafío, empezando en 1. */
  index: number;
  status: TestStatus;
  /** Solo en casos públicos: en los ocultos se omiten. */
  stdout?: string;
  expectedOutput?: string;
  stderr?: string;
  timeMs?: number;
  memoryKb?: number;
};

export type SubmissionRequest = {
  challengeId: string;
  language: "cpp";
  source: string;
};

export type SubmissionResult = {
  status: RunStatus;
  /** Mensajes del compilador, ya recortados. */
  compileOutput?: string;
  /** Explicación para el estudiante cuando no hay veredicto. */
  message?: string;
  tests: TestOutcome[];
};

/**
 * Frontera de ejecución.
 *
 * Ni los componentes ni la lógica del desafío saben cómo se ejecuta el código:
 * hablan con esta interfaz. Hoy la implementa un proveedor que llama a la API
 * de BytePath, que a su vez llama a Judge0; el navegador nunca habla con Judge0
 * ni conoce su clave.
 *
 * La unidad es el **envío**, no el caso de prueba: el cliente manda el código y
 * recibe un veredicto ya decidido. Nunca decide él si una solución es correcta.
 */
export interface ExecutionProvider {
  readonly id: string;
  submit(request: SubmissionRequest): Promise<SubmissionResult>;
}
