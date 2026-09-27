import { getCurrentUser } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Descarga de los datos propios, en JSON.
 *
 * Las tablas de BytePath se leen con la SESIÓN del usuario, no con la clave de
 * servicio: las políticas RLS garantizan que cada consulta devuelve solo sus
 * filas, aunque este código tuviera un error. La única excepción son los
 * contadores de límites de la cuenta (`rate_limits`), que no tienen política de
 * lectura: se leen con la clave de servicio filtrando por el id de la SESIÓN.
 *
 * De Supabase Auth se incluye lo que describe la cuenta (correo, fechas y los
 * metadatos del registro). NO se incluyen secretos: ni el hash de la
 * contraseña, ni tokens de sesión o de refresco, ni cookies. Tampoco lo que
 * BytePath no guarda (IP, navegador, código de los desafíos) ni lo que está en
 * los registros de los proveedores. Si cambia esta lista, hay que actualizar la
 * sección «Tus derechos» de la Política de Privacidad.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Las cuentas no están configuradas." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Inicia sesión para descargar tus datos." }, { status: 401 });

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  const tables = [
    ["perfil", "profiles", "username, created_at, updated_at"],
    ["suscripcion", "subscriptions", "status, plan, current_period_end, provider, provider_customer_id, provider_subscription_id, created_at, updated_at"],
    ["energia", "user_energy", "energy_remaining, last_regen_at, updated_at"],
    ["progreso", "lesson_activations", "course_slug, lesson_slug, activated_at, activated_on, quiz_status, quiz_solved, quiz_state, quiz_updated_at, challenge_passed_at, completed_at"],
    ["tokens", "user_tokens", "balance, updated_at"],
    ["movimientos_de_tokens", "token_transactions", "amount, type, course_slug, lesson_slug, created_at"],
    ["aceptaciones_legales", "legal_acceptances", "document_type, document_version, accepted_at"],
  ] as const;

  const sections: Record<string, unknown> = {};
  for (const [label, table, columns] of tables) {
    const { data, error } = await supabase.from(table).select(columns);
    sections[label] = error ? { no_disponible: true } : data;
  }

  // Contadores de límites de ESTA cuenta (id de la sesión, nunca de la petición).
  const admin = getSupabaseAdmin();
  let counters: unknown = { no_disponible: true };
  if (admin) {
    const { data, error } = await admin
      .from("rate_limits")
      .select("bucket, window_start, hits")
      .eq("user_id", user.id);
    if (!error) counters = data;
  }

  const body = {
    generado_en: new Date().toISOString(),
    cuenta: {
      id: user.id,
      correo: auth.user?.email ?? user.email,
      creada_en: auth.user?.created_at ?? null,
      correo_confirmado_en: auth.user?.email_confirmed_at ?? null,
      ultimo_inicio_de_sesion: auth.user?.last_sign_in_at ?? null,
      metodo_de_acceso: auth.user?.app_metadata?.provider ?? null,
      metadatos_del_registro: auth.user?.user_metadata ?? null,
    },
    ...sections,
    contadores_de_limites: counters,
    nota:
      "Datos que BytePath guarda sobre tu cuenta. No incluye secretos (hash de la contraseña, tokens de sesión, cookies), " +
      "el código de los desafíos (BytePath no lo guarda), los contadores por conexión (no están vinculados a tu cuenta) " +
      "ni los registros técnicos de Supabase, Judge0 o el alojamiento.",
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bytepath-mis-datos.json"',
      "Cache-Control": "no-store, private",
    },
  });
}
