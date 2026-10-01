/**
 * Catálogo de la tienda de BytePath.
 *
 * Hoy está VACÍO a propósito: todavía no hay objetos, ni compras, ni
 * inventario. Esto deja fijada la forma de un objeto para que añadir el
 * primero sea rellenar una entrada, no rediseñar la página.
 *
 * Importante para el día que haya compras: el precio de aquí es para PINTAR,
 * igual que `ENERGY_REFILL_COST` en `tokens/config.ts`. La autoridad sobre lo
 * que cuesta algo y sobre si se puede comprar tendrá que ser una función de la
 * base de datos (como `refill_energy_with_tokens()`), nunca este archivo ni un
 * valor que llegue del navegador.
 */

export type StoreItem = {
  /** Identificador estable: es el que usaría la futura función de compra. */
  id: string;
  name: string;
  description: string;
  /** Precio en tokens. Solo para mostrar; ver la nota de arriba. */
  price: number;
  /** Si hoy se puede adquirir. Un objeto puede anunciarse antes de estar disponible. */
  available: boolean;
};

export const STORE_ITEMS: readonly StoreItem[] = [];
