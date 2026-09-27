"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { AccountState } from "@/lib/energy/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Estado de la cuenta en el navegador.
 *
 * Es un almacén de módulo, no un contexto de React, por una razón concreta: el
 * medidor de energía aparece en la barra de navegación, en el camino y en la
 * lección, que son árboles distintos y ninguno cuelga del layout raíz.
 * Envolver la aplicación entera en un proveedor obligaría a renderizar bajo
 * demanda páginas que hoy son estáticas; un almacén de módulo no obliga a nada.
 *
 * Lo que guarda es un REFLEJO del servidor, nunca la verdad. Si alguien lo
 * manipula desde la consola solo consigue pintarse seis rayos de mentira: la
 * energía la descuenta la base de datos y `complete_lesson` la vuelve a
 * comprobar. Y precisamente por eso el reloj del navegador no decide nada: el
 * almacén se limita a volver a preguntar al servidor cuando la base de datos
 * dice que debería haber una energía nueva (`nextEnergyAt`), al volver a la
 * pestaña y al iniciar o cerrar sesión.
 */

let snapshot: AccountState | null = null;
let inFlight: Promise<void> | null = null;
let regenTimer: ReturnType<typeof setTimeout> | null = null;
let watching = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function sameState(a: AccountState, b: AccountState): boolean {
  return (
    a.signedIn === b.signedIn &&
    a.isPremium === b.isPremium &&
    a.metered === b.metered &&
    a.unavailable === b.unavailable &&
    a.remaining === b.remaining &&
    a.limit === b.limit &&
    a.nextEnergyAt === b.nextEnergyAt &&
    a.tokens === b.tokens
  );
}

/**
 * Programa la relectura para el momento en que llega la próxima energía. Es
 * solo un aviso para preguntar: la cifra nueva la pone el servidor, no este
 * temporizador. Un segundo de margen para no preguntar justo antes del tick.
 */
function scheduleRegenRefresh() {
  if (regenTimer !== null) {
    clearTimeout(regenTimer);
    regenTimer = null;
  }
  if (typeof window === "undefined" || !snapshot?.nextEnergyAt || snapshot.isPremium) return;

  const delay = new Date(snapshot.nextEnergyAt).getTime() - Date.now() + 1_000;
  if (!Number.isFinite(delay)) return;

  regenTimer = setTimeout(
    () => {
      regenTimer = null;
      void refreshAccount();
    },
    // setTimeout admite hasta ~24 días; el tick nunca está a más de 3 horas.
    Math.max(1_000, delay),
  );
}

function set(next: AccountState) {
  if (snapshot && sameState(snapshot, next)) return;
  snapshot = next;
  scheduleRegenRefresh();
  emit();
}

function watchVisibility() {
  if (watching || typeof document === "undefined") return;
  watching = true;
  // Al volver a la pestaña puede haber pasado un rato largo (portátil cerrado,
  // otra pestaña): la energía se relee en vez de fiarse de lo último visto.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshAccount();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  watchVisibility();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Publica el estado que acaba de devolver el servidor. Lo llaman las pantallas
 * con el estado con el que se renderizaron y el flujo de completar lección con
 * el que devuelve `complete_lesson`: es lo que hace que el medidor de la barra
 * baje en el acto sin volver a preguntar.
 */
export function publishAccountState(state: AccountState): void {
  set(state);
}

/**
 * Fusiona cambios sueltos en el estado ya conocido: recargar energía con
 * tokens no trae consigo el resto del bloque (isPremium, signedIn...), así que
 * sobrescribirlo entero borraría esos campos. Si todavía no hay snapshot, no
 * hace nada: la próxima lectura completa ya trae el valor correcto.
 */
export function patchAccountState(patch: Partial<AccountState>): void {
  if (!snapshot) return;
  set({ ...snapshot, ...patch });
}

/** Vuelve a preguntar al servidor. Las llamadas simultáneas comparten petición. */
export function refreshAccount(): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch("/api/cuenta", { cache: "no-store" });
      if (!response.ok) return;
      set((await response.json()) as AccountState);
    } catch {
      // Sin red no se cambia nada: se conserva lo último conocido y el
      // medidor sigue mostrando esa cifra en vez de parpadear a vacío.
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Estado vivo de la cuenta, con el que llegó del servidor como respaldo.
 *
 * Las pantallas que ya reciben el estado resuelto por el servidor (el camino,
 * la lección) lo pintan al instante con `initial` —sin parpadeo al cargar— y
 * lo publican en el almacén al montarse, para que la barra y el resto de
 * medidores lean lo mismo. A partir de ahí, lo más reciente gana: gastar
 * energía, recargarla o que el reloj regenere una.
 */
export function useLiveAccount(initial: AccountState): AccountState {
  const live = useAccountState();

  useEffect(() => {
    publishAccountState(initial);
  }, [initial]);

  return live ?? initial;
}

/**
 * Estado actual, o `null` mientras no ha llegado.
 *
 * Se resincroniza con `onAuthStateChange`: entrar o salir de la cuenta cambia
 * de quién es la energía, y el medidor tiene que enterarse sin recargar.
 */
export function useAccountState(): AccountState | null {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    // En el servidor no hay sesión que consultar: se renderiza el hueco vacío
    // y el valor real llega al hidratar.
    () => null,
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();

    // Al suscribirse, Supabase emite `INITIAL_SESSION`, así que la primera
    // lectura y los cambios posteriores entran por el mismo sitio.
    const { data } = supabase.auth.onAuthStateChange(() => {
      void refreshAccount();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}

/**
 * Cuenta Free a la que ahora mismo no le queda energía: completar una lección
 * le estaría cerrado hasta que vuelva 1. Solo para pintar (deshabilitar un
 * botón, elegir el aviso): el veredicto real lo da `complete_lesson`, que
 * vuelve a comprobarlo al pedirlo.
 */
export function useOutOfEnergy(): boolean {
  const account = useAccountState();
  return (
    account !== null &&
    account.signedIn &&
    account.metered &&
    !account.isPremium &&
    (account.remaining ?? 1) <= 0
  );
}
