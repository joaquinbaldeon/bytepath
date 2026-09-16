import type {
  ExecutionProvider,
  SubmissionRequest,
  SubmissionResult,
} from "@/lib/execution/types";

/**
 * Proveedor del navegador: habla con la API de BytePath y con nadie más.
 *
 * No sabe que Judge0 existe, no ve su clave y no decide veredictos: solo envía
 * el código y muestra lo que el servidor responde.
 */
export function createRemoteProvider(): ExecutionProvider {
  return {
    id: "bytepath-api",

    async submit(request: SubmissionRequest): Promise<SubmissionResult> {
      let response: Response;

      try {
        response = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
      } catch {
        return {
          status: "unavailable",
          message: "No se ha podido contactar con BytePath. Revisa tu conexión.",
          tests: [],
        };
      }

      if (!response.ok && response.status !== 200) {
        const fallback: SubmissionResult = {
          status: response.status === 503 ? "unavailable" : "internal_error",
          message: "No se ha podido ejecutar tu código.",
          tests: [],
        };

        try {
          const body = (await response.json()) as Partial<SubmissionResult>;
          return { ...fallback, ...body, tests: body.tests ?? [] };
        } catch {
          return fallback;
        }
      }

      return (await response.json()) as SubmissionResult;
    },
  };
}
