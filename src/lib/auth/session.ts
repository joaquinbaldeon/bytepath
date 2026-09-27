import "server-only";

import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Capa de acceso a la sesión en el servidor.
 *
 * Es el único sitio desde el que el resto del código de servidor debería
 * preguntar quién es el usuario. Está envuelto en `cache()` de React, así que
 * varias llamadas durante el mismo render se resuelven una sola vez.
 *
 * Se usa `getUser()` y no `getSession()`: la sesión sale de una cookie, que el
 * navegador puede manipular, mientras que `getUser()` la valida contra el
 * servidor de autenticación. Para el servidor, esa diferencia es la que separa
 * un dato de confianza de uno que no lo es.
 */

export type CurrentUser = {
  id: string;
  email: string | null;
};

export type CurrentProfile = {
  id: string;
  username: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

/**
 * Perfil del usuario actual. El username se lee de `profiles`, que es la
 * fuente de verdad: los metadatos del token conservan el valor del registro y
 * quedarían obsoletos en cuanto alguien cambie su nombre.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { id: data.id, username: data.username };
});
