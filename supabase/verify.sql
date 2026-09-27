-- ===========================================================================
-- BytePath · verify.sql
--
-- SOLO LECTURA. Pégalo entero en el SQL Editor del proyecto de Supabase que usa
-- BytePath y ejecútalo: no crea, cambia ni borra nada. Devuelve una fila por
-- comprobación con OK / FALLO y, si falla, qué falta.
--
-- Responde a: "¿se ejecutaron schema.sql, energy.sql, economy.sql,
-- progress.sql, legal.sql y auth-guard.sql en ESTE proyecto, y quedó todo como
-- el código lo espera?"
-- Si TODO sale OK y la app sigue sin leer el progreso, el problema no es el
-- esquema sino la conexión: comprueba que NEXT_PUBLIC_SUPABASE_URL de
-- .env.local es la de este mismo proyecto.
-- ===========================================================================

with
expected_tables (t) as (
  values ('profiles'), ('subscriptions'), ('user_energy'), ('lesson_activations'),
         ('user_tokens'), ('token_transactions'), ('legal_documents'), ('legal_acceptances'),
         ('rate_limits'), ('legal_config'),
         ('server_secrets'), ('auth_guard_config'), ('credential_change_tickets')
),
expected_columns (t, c) as (
  values
    ('lesson_activations', 'user_id'), ('lesson_activations', 'course_slug'),
    ('lesson_activations', 'lesson_slug'), ('lesson_activations', 'activated_at'),
    ('lesson_activations', 'quiz_status'), ('lesson_activations', 'quiz_state'),
    ('lesson_activations', 'quiz_updated_at'), ('lesson_activations', 'quiz_solved'),
    ('lesson_activations', 'challenge_passed_at'), ('lesson_activations', 'completed_at'),
    ('user_energy', 'user_id'), ('user_energy', 'energy_remaining'), ('user_energy', 'last_regen_at'),
    ('user_tokens', 'user_id'), ('user_tokens', 'balance'),
    ('legal_acceptances', 'user_id'), ('legal_acceptances', 'document_type'),
    ('legal_acceptances', 'document_version'), ('legal_acceptances', 'accepted_at')
),
-- name, args (para regclass/has_function_privilege), quién DEBE poder ejecutarla
expected_functions (fn, sig, who) as (
  values
    ('get_account_state',        'public.get_account_state(text, text)',                                        'authenticated'),
    ('refill_energy_with_tokens','public.refill_energy_with_tokens()',                                          'authenticated'),
    ('start_lesson',             'public.start_lesson(uuid, text, text, text)',                                 'service_role'),
    ('record_quiz_answer',       'public.record_quiz_answer(uuid, text, text, text, boolean, text[])',          'service_role'),
    ('save_quiz_state',          'public.save_quiz_state(uuid, text, text, jsonb)',                             'service_role'),
    ('reset_quiz_progress',      'public.reset_quiz_progress(uuid, text, text)',                                'service_role'),
    ('record_challenge_pass',    'public.record_challenge_pass(uuid, text, text)',                              'service_role'),
    ('complete_lesson',          'public.complete_lesson(uuid, text, text, text, boolean, boolean)',            'service_role'),
    ('username_available',       'public.username_available(text)',                                            'service_role'),
    ('consume_rate_limit',       'public.consume_rate_limit(text, text, uuid, integer, integer)',               'service_role'),
    ('accept_legal_document',    'public.accept_legal_document(text, text)',                                     'authenticated'),
    ('consume_run_quota',        'public.consume_run_quota()',                                                  'authenticated'),
    ('issue_signup_proof',       'public.issue_signup_proof(text)',                                             'service_role'),
    ('issue_password_change_ticket', 'public.issue_password_change_ticket(uuid)',                               'service_role')
),
checks as (
  -- 1. Tablas
  select 10 as ord, 'Tabla public.' || t as check_name,
         case when to_regclass('public.' || t) is not null then 'OK' else 'FALLO' end as resultado,
         case when to_regclass('public.' || t) is not null then ''
              else 'No existe. Ejecuta ' || case when t in ('user_tokens', 'token_transactions') then 'economy.sql'
                                                  when t = 'profiles' then 'schema.sql'
                                                  when t like 'legal_%' then 'legal.sql'
                                                  when t = 'rate_limits' then 'security.sql'
                                                  when t = 'legal_config' then 'legal.sql'
                                                  when t in ('server_secrets', 'auth_guard_config', 'credential_change_tickets') then 'auth-guard.sql'
                                                  else 'energy.sql' end
              || ' (o setup.sql) en este proyecto.' end as detalle
  from expected_tables

  union all
  -- 2. Columnas que el código lee o escribe
  select 20, 'Columna ' || e.t || '.' || e.c,
         case when exists (select 1 from information_schema.columns k
                           where k.table_schema = 'public' and k.table_name = e.t and k.column_name = e.c)
              then 'OK' else 'FALLO' end,
         case when exists (select 1 from information_schema.columns k
                           where k.table_schema = 'public' and k.table_name = e.t and k.column_name = e.c)
              then '' else 'Falta. Vuelve a ejecutar setup.sql (añade columnas con IF NOT EXISTS, sin tocar datos).' end
  from expected_columns e

  union all
  -- 3. RLS activo
  select 30, 'RLS activo en ' || t,
         case when c.relrowsecurity then 'OK' else 'FALLO' end,
         case when c.relrowsecurity then '' else 'Sin RLS cualquiera con la clave publicable podría leer/escribir la tabla.' end
  from expected_tables et
  join pg_class c on c.oid = to_regclass('public.' || et.t)
  where et.t <> 'profiles'

  union all
  -- 4. Solo políticas de lectura (la escritura es del servidor)
  select 40, 'Solo políticas SELECT en ' || t,
         case when (select count(*) from pg_policies p
                    where p.schemaname = 'public' and p.tablename = et.t and p.cmd <> 'SELECT') = 0
              then 'OK' else 'FALLO' end,
         (select coalesce(string_agg(p.policyname || ' (' || p.cmd || ')', ', '), '')
            from pg_policies p
           where p.schemaname = 'public' and p.tablename = et.t and p.cmd <> 'SELECT')
  from expected_tables et
  where et.t in ('subscriptions', 'user_energy', 'lesson_activations', 'user_tokens', 'token_transactions', 'legal_acceptances')
    and to_regclass('public.' || et.t) is not null

  union all
  -- 5. Un usuario autenticado lee SOLO sus filas: existe la política y filtra por auth.uid()
  select 50, 'Política de lectura propia en lesson_activations',
         case when exists (select 1 from pg_policies p
                           where p.schemaname = 'public' and p.tablename = 'lesson_activations'
                             and p.cmd = 'SELECT' and 'authenticated' = any (p.roles)
                             and p.qual like '%auth.uid()%' and p.qual like '%user_id%')
              then 'OK' else 'FALLO' end,
         'Debe existir una política SELECT para authenticated con user_id = auth.uid().'
  where to_regclass('public.lesson_activations') is not null

  union all
  -- 6. Privilegios de tabla: authenticated lee, nadie del navegador escribe
  select 60, 'Privilegios de ' || et.t || ': lectura sí, escritura no',
         case when has_table_privilege('authenticated', 'public.' || et.t, 'SELECT')
                and not has_table_privilege('authenticated', 'public.' || et.t, 'INSERT')
                and not has_table_privilege('authenticated', 'public.' || et.t, 'UPDATE')
                and not has_table_privilege('authenticated', 'public.' || et.t, 'DELETE')
                and not has_table_privilege('anon', 'public.' || et.t, 'INSERT')
                and not has_table_privilege('anon', 'public.' || et.t, 'UPDATE')
                and not has_table_privilege('anon', 'public.' || et.t, 'DELETE')
              then 'OK' else 'FALLO' end,
         'authenticated debe tener SELECT y ni INSERT/UPDATE/DELETE; anon no debe escribir.'
  from expected_tables et
  where et.t in ('subscriptions', 'user_energy', 'lesson_activations', 'user_tokens', 'token_transactions', 'legal_acceptances')
    and to_regclass('public.' || et.t) is not null

  union all
  -- 7. Funciones: existen con la firma que llama el código
  select 70, 'Función ' || fn,
         case when to_regprocedure(sig) is not null then 'OK' else 'FALLO' end,
         case when to_regprocedure(sig) is not null then ''
              else 'No existe con la firma ' || sig || '. Ejecuta ' ||
                   case when fn in ('get_account_state') then 'energy.sql y economy.sql'
                        when fn = 'refill_energy_with_tokens' then 'economy.sql'
                        when fn = 'username_available' then 'schema.sql'
                        when fn = 'consume_rate_limit' then 'security.sql'
                        when fn = 'accept_legal_document' then 'legal.sql'
                        when fn = 'consume_run_quota' then 'security.sql'
                        else 'progress.sql' end || ' (o setup.sql).' end
  from expected_functions

  union all
  -- 8. Quién puede ejecutarlas
  select 80, 'Permisos de ' || fn || ': solo ' || who,
         case when who = 'authenticated'
                then case when has_function_privilege('authenticated', to_regprocedure(sig), 'EXECUTE')
                           and not has_function_privilege('anon', to_regprocedure(sig), 'EXECUTE') then 'OK' else 'FALLO' end
              else case when has_function_privilege('service_role', to_regprocedure(sig), 'EXECUTE')
                         and not has_function_privilege('anon', to_regprocedure(sig), 'EXECUTE')
                         and not has_function_privilege('authenticated', to_regprocedure(sig), 'EXECUTE') then 'OK' else 'FALLO' end
         end,
         case when who = 'authenticated' then 'Debe poder ejecutarla authenticated y no anon.'
              else 'Solo service_role (el servidor). Si authenticated pudiera, cualquiera saltaría el quiz desde la consola.' end
  from expected_functions
  where to_regprocedure(sig) is not null

  union all
  -- 9. Restos de versiones antiguas que ya no deben existir
  select 90, 'Función obsoleta ' || old.fn || ' ausente',
         case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.proname = old.fn) then 'FALLO' else 'OK' end,
         'Es de la primera versión (cobraba energía al entrar). Vuelve a ejecutar setup.sql: la elimina.'
  from (values ('consume_lesson_energy'), ('save_quiz_progress')) as old (fn)

  union all
  -- 9b. profiles: segunda cerradura (security.sql)
  select 95, 'Privilegios de profiles: anon nada; authenticated solo lee',
         case when not has_table_privilege('anon', 'public.profiles', 'SELECT')
                and not has_table_privilege('anon', 'public.profiles', 'UPDATE')
                and not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
                and not has_table_privilege('authenticated', 'public.profiles', 'DELETE')
                and has_table_privilege('authenticated', 'public.profiles', 'SELECT')
                and not has_column_privilege('authenticated', 'public.profiles', 'username', 'UPDATE')
                and not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE')
              then 'OK' else 'FALLO' end,
         'Ejecuta security.sql (o setup.sql).'

  union all
  select 96, 'rate_limits sin acceso desde el navegador',
         case when to_regclass('public.rate_limits') is not null
                and not has_table_privilege('anon', 'public.rate_limits', 'SELECT')
                and not has_table_privilege('authenticated', 'public.rate_limits', 'SELECT')
              then 'OK' else 'FALLO' end,
         'Ejecuta security.sql (o setup.sql).'

  union all
  -- 9c. Funciones internas: nadie las ejecuta desde fuera
  select 97, 'Función interna ' || f.fn || ' cerrada al cliente',
         case when to_regprocedure(f.sig) is not null
                and not has_function_privilege('anon', to_regprocedure(f.sig), 'EXECUTE')
                and not has_function_privilege('authenticated', to_regprocedure(f.sig), 'EXECUTE')
              then 'OK' else 'FALLO' end,
         'Ejecuta security.sql / legal.sql (o setup.sql).'
  from (values ('_rate_limit_hit', 'public._rate_limit_hit(text, text, uuid, integer, integer)'),
               ('current_legal_version', 'public.current_legal_version(text)'),
               ('_signup_proof_mac', 'public._signup_proof_mac(text, bigint)'),
               ('_signup_proof_valid', 'public._signup_proof_valid(text, text)'),
               ('guard_auth_user_insert', 'public.guard_auth_user_insert()'),
               ('guard_auth_user_update', 'public.guard_auth_user_update()')) as f (fn, sig)

  union all
  -- 9d. Índices de rate_limits
  select 98, 'Índice ' || i.name,
         case when to_regclass('public.' || i.name) is not null then 'OK' else 'FALLO' end,
         'Ejecuta security.sql (o setup.sql).'
  from (values ('rate_limits_window_start_idx'), ('rate_limits_user_id_idx')) as i (name)

  union all
  -- 9e. Exigencia de aceptación en el alta: informativo (se activa con la migración 0002)
  select 99, 'Exigencia de Términos en el alta',
         case when to_regclass('public.legal_config') is null then 'FALLO' else 'INFO' end,
         case when to_regclass('public.legal_config') is null then 'Falta legal_config: ejecuta legal.sql (o setup.sql).'
              else 'Estado actual: ' || coalesce((select case when c.require_terms_on_signup then 'ACTIVADA' else 'desactivada (transición)' end from public.legal_config c where c.id), '¿sin fila?')
                   || '. Se activa con supabase/migrations/0002 tras desplegar el código que envía terms_version.' end

  union all
  -- 10. Aceptación de los Términos en el alta (legal.sql)
  select 100, 'Hay una versión vigente de los Términos',
         case when to_regprocedure('public.current_legal_version(text)') is not null
                and public.current_legal_version('terms') is not null
              then 'OK' else 'FALLO' end,
         'Vigente: ' || coalesce(case when to_regprocedure('public.current_legal_version(text)') is not null then public.current_legal_version('terms') end, 'ninguna')
         || '. Debe coincidir con TERMS_VERSION de src/lib/legal/documents.ts.'

  union all
  select 101, 'Trigger de alta que registra la aceptación',
         case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
                           where n.nspname = 'auth' and c.relname = 'users' and t.tgname = 'on_auth_user_created_terms' and not t.tgisinternal)
              then 'OK' else 'FALLO' end,
         'Sin él, las cuentas nuevas se crean sin dejar constancia de qué Términos aceptaron. Ejecuta legal.sql.'

  union all
  -- 11. Altas y credenciales solo a través del servidor (auth-guard.sql)
  select 102, 'Trigger ' || g.name || ' en auth.users',
         case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
                           where n.nspname = 'auth' and c.relname = 'users' and t.tgname = g.name and not t.tgisinternal)
              then 'OK' else 'FALLO' end,
         'Ejecuta auth-guard.sql (o setup.sql).'
  from (values ('guard_auth_user_insert'), ('guard_auth_user_update')) as g (name)

  union all
  select 103, 'Secreto de la prueba de alta generado (no se muestra)',
         case when to_regclass('public.server_secrets') is not null
                and exists (select 1 from public.server_secrets s where s.name = 'signup_proof' and length(s.secret) >= 32)
              then 'OK' else 'FALLO' end,
         'Ejecuta auth-guard.sql (o setup.sql). El secreto lo genera la propia base de datos.'

  union all
  select 104, 'Secretos y permisos de credenciales sin acceso desde el navegador',
         case when to_regclass('public.server_secrets') is not null
                and not has_table_privilege('anon', 'public.server_secrets', 'SELECT')
                and not has_table_privilege('authenticated', 'public.server_secrets', 'SELECT')
                and not has_table_privilege('authenticated', 'public.credential_change_tickets', 'SELECT')
                and not has_table_privilege('authenticated', 'public.auth_guard_config', 'UPDATE')
              then 'OK' else 'FALLO' end,
         'Ejecuta auth-guard.sql (o setup.sql).'

  union all
  select 105, 'Exigencia de altas y credenciales por el servidor',
         case when to_regclass('public.auth_guard_config') is null then 'FALLO' else 'INFO' end,
         case when to_regclass('public.auth_guard_config') is null then 'Falta auth_guard_config: ejecuta auth-guard.sql (o setup.sql).'
              else 'Estado actual: ' || coalesce((select case when c.enforce then 'ACTIVADA' else 'desactivada (transición)' end from public.auth_guard_config c where c.id), '¿sin fila?')
                   || '. Se activa con supabase/migrations/0004 tras desplegar el código que envía la prueba de alta.' end
)
select ord as "#", check_name as comprobacion, resultado, detalle
from checks
order by ord, check_name;
