import "server-only";

import { readAccountState } from "@/lib/energy/server";

/**
 * Derechos de la cuenta: qué puede hacer este usuario por haber pagado.
 *
 * Este archivo existe para que la pregunta "¿es Premium?" tenga UNA respuesta
 * y un solo sitio donde buscarla. En el código no hay —ni debe haber— ninguna
 * comparación de correos, ninguna lista de usuarios privilegiados, ninguna
 * bandera de desarrollo. Premium es, literalmente, tener una suscripción
 * vigente en la tabla `subscriptions`, y eso lo decide `public.is_premium()`
 * dentro de la base de datos.
 *
 * ---------------------------------------------------------------------------
 * Cadena completa, hoy y cuando haya cobros:
 *
 *     hoy:      fila en subscriptions (puesta a mano en el panel)
 *                 → is_premium()  →  getEntitlements()  →  interfaz
 *
 *     mañana:   proveedor de pagos → webhook (clave service_role)
 *                 → fila en subscriptions
 *                 → is_premium()  →  getEntitlements()  →  interfaz
 *
 * Solo cambia el primer eslabón. Ni esta función ni nada que la use se entera.
 * ---------------------------------------------------------------------------
 *
 * El navegador NO es autoridad de esto. Puede recibir el resultado para
 * pintarse —ocultar anuncios, mostrar ∞— pero cualquier cosa que importe de
 * verdad se vuelve a comprobar en el servidor, y la energía se descuenta en
 * una función SQL que consulta `is_premium()` por su cuenta.
 */

export type Entitlements = {
  /** Suscripción vigente. La única fuente es la tabla `subscriptions`. */
  isPremium: boolean;
  /** Sin límite diario de energía. */
  unlimitedEnergy: boolean;
  /** No se renderiza ningún anuncio. */
  adFree: boolean;
};

const FREE: Entitlements = {
  isPremium: false,
  unlimitedEnergy: false,
  adFree: false,
};

const PREMIUM: Entitlements = {
  isPremium: true,
  unlimitedEnergy: true,
  adFree: true,
};

/**
 * Derechos del usuario de esta petición.
 *
 * Los tres derechos se derivan de uno solo a propósito: mientras solo haya un
 * plan de pago, tener dos verdades separadas ("es premium" y "no ve anuncios")
 * solo serviría para que un día dejaran de coincidir. El día que haya varios
 * planes, este es el sitio donde se separan.
 */
export async function getEntitlements(): Promise<Entitlements> {
  const state = await readAccountState();
  return state.isPremium ? PREMIUM : FREE;
}

/** Atajo de lectura para los sitios que solo necesitan el booleano. */
export async function isPremium(): Promise<boolean> {
  return (await getEntitlements()).isPremium;
}
