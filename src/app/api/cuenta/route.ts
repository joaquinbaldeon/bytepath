import { readAccountState } from "@/lib/energy/server";

/**
 * Estado de la cuenta para la interfaz: si eres Premium, cuánta energía te
 * queda, cuándo llega la siguiente y cuántos tokens tienes.
 *
 * Es un route handler y no una Server Action porque solo lee. Next despacha
 * las Server Actions de una en una por cliente, y esta consulta la hacen
 * varios componentes a la vez (la barra, el camino) nada más cargar la página
 * y cada vez que la energía se regenera.
 *
 * Quién pregunta lo decide la cookie de sesión, nunca un parámetro: no hay
 * forma de pedir el estado de otra persona. Y lo que se devuelve es para
 * pintar; ninguna decisión de verdad se toma con esto.
 */
export async function GET() {
  const state = await readAccountState();

  return Response.json(state, {
    headers: {
      // Lleva datos de una sesión concreta: no puede guardarse en ninguna
      // caché intermedia ni servirse a otra persona.
      "Cache-Control": "no-store, private",
    },
  });
}
