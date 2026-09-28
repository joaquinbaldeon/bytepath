"use client";

import { useSyncExternalStore } from "react";

/**
 * Formatea una cuenta atrás hasta un instante conocido, como "2h 14m".
 *
 * IMPORTANTE: esto no es una fuente de verdad. El instante (`targetIso`) lo
 * da el servidor; aquí solo se resta contra la hora del navegador para
 * decidir qué texto mostrar. Ninguna energía se calcula ni se incrementa
 * aquí: si el reloj del navegador está mal, lo único que sale mal es el
 * texto, nunca el saldo, porque el saldo nunca sale de este hook.
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return "ya mismo";
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Reloj compartido, al minuto. `Date.now()` es impuro y no puede llamarse
 * durante el render (lo marca el linter de React Compiler) ni tampoco con un
 * `setState` síncrono dentro de un efecto (misma regla: evita cascadas de
 * render). `useSyncExternalStore` es la vía que React ofrece exactamente para
 * esto —leer un valor externo que cambia solo— así que el reloj vive aquí,
 * compartido entre todos los medidores de la página en vez de un
 * `setInterval` por componente.
 */
const listeners: Set<() => void> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  intervalId ??= setInterval(() => {
    for (const notify of listeners) notify();
  }, 60_000);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

/** El minuto en curso, como entero: estable dentro del mismo minuto, cambia una vez por minuto. */
function getSnapshot(): number {
  return Math.floor(Date.now() / 60_000);
}

/**
 * En el servidor no hay reloj de navegador que leer, así que no hay un
 * "ahora" real. `-1` es un centinela, no un instante: si se tratara como
 * minuto 0 (epoch), la resta de más abajo daría el tiempo hasta `targetIso`
 * contado desde 1970, un número de horas absurdo durante ese primer render
 * (y en el HTML que llega del servidor) hasta que el reloj real toma el
 * relevo al montarse.
 */
function getServerSnapshot(): number {
  return -1;
}

/**
 * Cuenta atrás hasta `targetIso`, o `null` si no hay ningún instante que
 * mostrar (ya está al tope, no aplica, o el reloj real todavía no se ha
 * montado en el cliente).
 */
export function useCountdown(targetIso: string | null): string | null {
  const minuteBucket = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!targetIso || minuteBucket < 0) return null;
  return formatCountdown(new Date(targetIso).getTime() - minuteBucket * 60_000);
}
