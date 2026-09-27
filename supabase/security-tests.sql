-- ===========================================================================
-- BytePath · pruebas de seguridad (aislamiento entre usuarios, privilegios,
-- límite de peticiones, aceptación legal y borrado de cuenta)
--
-- Pegar ENTERO en el SQL Editor de Supabase y ejecutar, después de schema.sql
-- y setup.sql. Crea dos cuentas de prueba DENTRO de una transacción que
-- termina en ROLLBACK: no deja rastro.
-- ===========================================================================

begin;

create temporary table security_test_results (
  n int,
  caso text,
  resultado text,
  detalle text
) on commit drop;

do $$
declare
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_t text;
  v_ok boolean;
  v_detail text;
  v_count int;
  v_out jsonb;
  v_first timestamptz;
  v_plan record;
  v_tables text[] := array['subscriptions', 'user_energy', 'lesson_activations', 'user_tokens',
                           'token_transactions', 'legal_acceptances', 'rate_limits'];
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_a, 'sec_a@example.test', '{"username":"sec_test_a","terms_version":"1.0"}'),
         (v_b, 'sec_b@example.test', '{"username":"sec_test_b","terms_version":"1.0"}');

  -- Datos de B en todas las tablas con dueño (como superusuario).
  insert into public.subscriptions (user_id, status, plan) values (v_b, 'active', 'premium_test');
  insert into public.user_energy (user_id, energy_remaining, last_regen_at) values (v_b, 3, now());
  insert into public.lesson_activations (user_id, course_slug, lesson_slug) values (v_b, 'c', 'l');
  insert into public.user_tokens (user_id, balance) values (v_b, 42);
  insert into public.token_transactions (user_id, amount, type, course_slug, lesson_slug) values (v_b, 15, 'lesson_completion', 'c', 'l');
  insert into public.rate_limits (bucket, subject, user_id, window_start, hits) values ('runs:minute', v_b::text, v_b, now(), 1);
  -- (legal_acceptances de B ya la creó el trigger de alta)

  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text, 'role', 'authenticated')::text, true);

  ---------------------------------------------------------------------------
  -- 1. A no LEE nada de B (y, sin permiso, rate_limits ni se puede consultar)
  ---------------------------------------------------------------------------
  v_detail := '';
  v_ok := true;
  set local role authenticated;
  foreach v_t in array v_tables loop
    begin
      execute format('select count(*) from public.%I where user_id = $1', v_t) into v_count using v_b;
      if v_count <> 0 then v_ok := false; v_detail := v_detail || v_t || '=' || v_count || ' '; end if;
    exception when insufficient_privilege then
      v_detail := v_detail || v_t || ':sin permiso ';
    end;
  end loop;
  select count(*) into v_count from public.profiles where id = v_b;
  if v_count <> 0 then v_ok := false; v_detail := v_detail || 'profiles=' || v_count; end if;
  reset role;
  insert into security_test_results values (1, 'Usuario A no puede leer datos de B en ninguna tabla', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 2. A no MODIFICA ni BORRA nada de B
  ---------------------------------------------------------------------------
  begin
    set local role authenticated;
    update public.profiles set username = 'robado_x' where id = v_b;
    get diagnostics v_count = row_count;
    reset role;
    v_detail := v_count || ' filas';
  exception when insufficient_privilege then
    reset role; v_count := 0; v_detail := 'permission denied';
  end;
  insert into security_test_results values (2, 'A no puede cambiar el username de B', case when v_count = 0 and (select username from public.profiles where id = v_b) = 'sec_test_b' then 'OK' else 'FALLO' end, v_detail);

  v_ok := true; v_detail := '';
  foreach v_t in array v_tables || array['profiles'] loop
    begin
      set local role authenticated;
      execute format('delete from public.%I', v_t);
      reset role;
      v_ok := false; v_detail := v_detail || v_t || ' ';
    exception when insufficient_privilege then
      reset role;
    end;
  end loop;
  insert into security_test_results values (3, 'Ningún usuario puede borrar filas de ninguna tabla (ni propias ni ajenas)', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_ok := true; v_detail := '';
  begin
    set local role authenticated;
    insert into public.user_tokens (user_id, balance) values (v_a, 99999);
    reset role; v_ok := false; v_detail := 'user_tokens ';
  exception when insufficient_privilege then reset role;
  end;
  begin
    set local role authenticated;
    insert into public.profiles (id, username) values (gen_random_uuid(), 'intruso_x');
    reset role; v_ok := false; v_detail := v_detail || 'profiles';
  exception when insufficient_privilege then reset role;
  end;
  insert into security_test_results values (4, 'Ningún usuario puede insertar filas directamente', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 5-6. profiles: ni siquiera A cambia SU username desde el navegador (no hay
  --      interfaz y dejaría desfasados los metadatos de Auth), ni otras columnas
  ---------------------------------------------------------------------------
  begin
    set local role authenticated;
    update public.profiles set username = 'sec_test_a2' where id = v_a;
    reset role; v_ok := false; v_detail := 'Pudo cambiar su username';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  v_ok := v_ok and (select username from public.profiles where id = v_a) = 'sec_test_a';
  insert into security_test_results values (5, 'A no puede cambiar su username desde el navegador', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  begin
    set local role authenticated;
    update public.profiles set created_at = now() - interval '5 years' where id = v_a;
    reset role; v_ok := false; v_detail := 'Pudo cambiar created_at';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  insert into security_test_results values (6, 'A no puede cambiar otras columnas de su perfil', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 7. Ninguna función que reciba un usuario como parámetro es ejecutable desde
  --    el navegador (así nadie puede actuar "como" otro user_id)
  ---------------------------------------------------------------------------
  select coalesce(string_agg(p.oid::regprocedure::text, ', '), '') into v_detail
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (p.proargtypes::oid[] @> array['uuid'::regtype::oid])
    and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
  insert into security_test_results values (7, 'Ninguna función con parámetro uuid es ejecutable por anon/authenticated', case when v_detail = '' then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 8. Toda función SECURITY DEFINER fija su search_path
  ---------------------------------------------------------------------------
  select coalesce(string_agg(p.proname, ', '), '') into v_detail
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');
  insert into security_test_results values (8, 'Toda función SECURITY DEFINER fija search_path', case when v_detail = '' then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 9. Enumeración de usernames: la función ya no es del navegador
  ---------------------------------------------------------------------------
  v_ok := not has_function_privilege('anon', 'public.username_available(text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.username_available(text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.username_available(text)', 'EXECUTE');
  insert into security_test_results values (9, 'username_available solo la ejecuta el servidor', case when v_ok then 'OK' else 'FALLO' end, '');

  ---------------------------------------------------------------------------
  -- 10-12. Límite de peticiones
  ---------------------------------------------------------------------------
  for i in 1..3 loop
    v_out := public.consume_rate_limit('test:bucket', v_a::text, v_a, 3, 60);
  end loop;
  v_ok := (v_out ->> 'allowed')::boolean and (v_out ->> 'remaining')::int = 0;
  v_out := public.consume_rate_limit('test:bucket', v_a::text, v_a, 3, 60);
  v_ok := v_ok and not (v_out ->> 'allowed')::boolean and (v_out ->> 'retry_after')::int between 1 and 60;
  insert into security_test_results values (10, 'Límite 3/min: la 4.ª petición se rechaza con retry_after', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  update public.rate_limits set window_start = now() - interval '61 seconds' where bucket = 'test:bucket';
  v_out := public.consume_rate_limit('test:bucket', v_a::text, v_a, 3, 60);
  select hits into v_count from public.rate_limits where bucket = 'test:bucket';
  insert into security_test_results values (11, 'Al terminar la ventana el contador vuelve a empezar (sin historial)', case when (v_out ->> 'allowed')::boolean and v_count = 1 then 'OK' else 'FALLO' end, v_out::text);

  v_ok := not has_function_privilege('authenticated', 'public.consume_rate_limit(text, text, uuid, integer, integer)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.consume_rate_limit(text, text, uuid, integer, integer)', 'EXECUTE');
  insert into security_test_results values (12, 'Solo el servidor puede consumir o reiniciar cupos', case when v_ok then 'OK' else 'FALLO' end, '');

  ---------------------------------------------------------------------------
  -- 13-15. Aceptación con la cuenta ya creada
  ---------------------------------------------------------------------------
  delete from public.legal_acceptances where user_id = v_a;
  set local role authenticated;
  v_out := public.accept_legal_document('terms', '1.0');
  reset role;
  select accepted_at into v_first from public.legal_acceptances where user_id = v_a and document_version = '1.0';
  insert into security_test_results values (13, 'Un usuario acepta la versión vigente con su sesión', case when (v_out ->> 'accepted')::boolean and v_first is not null then 'OK' else 'FALLO' end, v_out::text);

  perform pg_sleep(0.01);
  set local role authenticated;
  v_out := public.accept_legal_document('terms', '1.0');
  reset role;
  select count(*) into v_count from public.legal_acceptances where user_id = v_a;
  v_ok := v_count = 1 and (select accepted_at from public.legal_acceptances where user_id = v_a) = v_first;
  insert into security_test_results values (14, 'Aceptar otra vez no crea duplicados ni cambia la fecha original', case when v_ok then 'OK' else 'FALLO' end, v_count || ' filas');

  set local role authenticated;
  v_out := public.accept_legal_document('terms', '9.9');
  reset role;
  insert into security_test_results values (15, 'No se puede aceptar una versión no publicada', case when not (v_out ->> 'accepted')::boolean then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 16. Borrar la cuenta borra todos sus datos de BytePath
  ---------------------------------------------------------------------------
  delete from auth.users where id = v_b;
  v_detail := '';
  foreach v_t in array v_tables loop
    execute format('select count(*) from public.%I where user_id = $1', v_t) into v_count using v_b;
    if v_count <> 0 then v_detail := v_detail || v_t || '=' || v_count || ' '; end if;
  end loop;
  select count(*) into v_count from public.profiles where id = v_b;
  if v_count <> 0 then v_detail := v_detail || 'profiles=' || v_count; end if;
  insert into security_test_results values (16, 'Eliminar la cuenta no deja filas suyas en ninguna tabla de BytePath', case when v_detail = '' then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 17-19. Cupo de ejecuciones con la sesión del usuario (sin clave de servicio)
  ---------------------------------------------------------------------------
  delete from public.rate_limits where user_id = v_a;
  set local role authenticated;
  for i in 1..12 loop
    v_out := public.consume_run_quota();
  end loop;
  v_ok := (v_out ->> 'allowed')::boolean;
  v_out := public.consume_run_quota();
  reset role;
  v_ok := v_ok and not (v_out ->> 'allowed')::boolean and (v_out ->> 'retry_after')::int between 1 and 60;
  select count(*) into v_count from public.rate_limits where subject <> v_a::text and user_id is not null;
  insert into security_test_results values (17, 'consume_run_quota: 12/min con la sesión del usuario; la 13.ª se rechaza', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  select count(*) into v_count from public.rate_limits where bucket like 'runs:%' and subject = v_a::text and user_id = v_a;
  insert into security_test_results values (18, 'El cupo solo toca las filas del propio usuario (sujeto = auth.uid())', case when v_count = 2 then 'OK' else 'FALLO' end, v_count || ' filas de A');

  v_ok := not has_function_privilege('anon', 'public.consume_run_quota()', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.consume_run_quota()', 'EXECUTE')
      and not has_function_privilege('service_role', 'public._rate_limit_hit(text, text, uuid, integer, integer)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public._rate_limit_hit(text, text, uuid, integer, integer)', 'EXECUTE');
  perform set_config('request.jwt.claims', '', true);
  set local role authenticated;
  v_out := public.consume_run_quota();
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text, 'role', 'authenticated')::text, true);
  v_ok := v_ok and (v_out ->> 'reason') = 'not_signed_in';
  insert into security_test_results values (19, 'Sin sesión no hay cupo; el núcleo _rate_limit_hit no es ejecutable por nadie', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 20-21. Limpieza acotada de filas caducadas
  ---------------------------------------------------------------------------
  insert into public.rate_limits (bucket, subject, user_id, window_start, hits)
  select 'test:old', 'ip:viejo' || g, null, now() - interval '3 days', 1 from generate_series(1, 30) g;
  perform public.consume_rate_limit('test:cleanup', 'x', null, 100, 60);
  select count(*) into v_count from public.rate_limits where bucket = 'test:old';
  v_ok := v_count = 10;
  perform public.consume_rate_limit('test:cleanup', 'x', null, 100, 60);
  select count(*) into v_count from public.rate_limits where bucket = 'test:old';
  v_ok := v_ok and v_count = 0 and exists (select 1 from public.rate_limits where bucket = 'runs:minute' and subject = v_a::text);
  insert into security_test_results values (20, 'Cada llamada borra hasta 20 filas caducadas (>2 días) y no toca las vivas', case when v_ok then 'OK' else 'FALLO' end, 'quedan ' || v_count);

  -- Plan completo (todas las líneas de EXPLAIN), con el recorrido secuencial
  -- desactivado para ver si el índice es utilizable (con tablas pequeñas el
  -- planificador prefiere recorrerlas enteras, y eso es correcto).
  set local enable_seqscan = off;
  v_detail := '';
  for v_plan in execute 'explain select 1 from public.rate_limits where window_start < now() - interval ''2 days'' limit 20' loop
    v_detail := v_detail || v_plan."QUERY PLAN" || ' ';
  end loop;
  v_ok := v_detail ilike '%rate_limits_window_start_idx%';
  v_detail := '';
  for v_plan in execute 'explain delete from public.rate_limits where user_id = ''00000000-0000-0000-0000-000000000000''::uuid' loop
    v_detail := v_detail || v_plan."QUERY PLAN" || ' ';
  end loop;
  v_ok := v_ok and v_detail ilike '%rate_limits_user_id_idx%';
  reset enable_seqscan;
  insert into security_test_results values (21, 'La limpieza y el borrado en cascada pueden usar sus índices', case when v_ok then 'OK' else 'FALLO' end, v_detail);
end $$;

-- ===========================================================================
-- 22-30. Altas y credenciales solo a través del servidor (auth-guard.sql).
-- La exigencia se activa SOLO dentro de esta transacción (termina en ROLLBACK).
-- ===========================================================================
do $$
declare
  v_ok boolean;
  v_detail text;
  v_proof text;
  v_id uuid;
  v_meta jsonb;
  v_now bigint := floor(extract(epoch from now()))::bigint;
begin
  update public.auth_guard_config set enforce = true where id;

  -- 22. Alta sin prueba (lo que hace POST /auth/v1/signup con la clave pública)
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'guard_x@example.test', '{"username":"guard_sin_prueba"}');
    v_ok := false; v_detail := 'se creó la cuenta';
  exception when check_violation then v_ok := true; v_detail := sqlerrm;
  end;
  insert into security_test_results values (22, 'Alta directa sin prueba del servidor → rechazada', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  -- 23. Alta con la prueba que emite el servidor → se crea, y la prueba NO se guarda
  v_proof := public.issue_signup_proof('Guard_OK@Example.test ');
  v_id := gen_random_uuid();
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_id, 'guard_ok@example.test', jsonb_build_object('username', 'guard_ok', 'signup_proof', v_proof));
  select raw_user_meta_data into v_meta from auth.users where id = v_id;
  v_ok := not (v_meta ? 'signup_proof') and v_meta ->> 'username' = 'guard_ok'
      and exists (select 1 from public.profiles where id = v_id and username = 'guard_ok');
  insert into security_test_results values (23, 'Alta con prueba válida → creada, perfil creado y prueba retirada de los metadatos', case when v_ok then 'OK' else 'FALLO' end, v_meta::text);

  -- 24. Pruebas inválidas: otro correo, firma alterada, caducada, del futuro, basura
  v_ok := true; v_detail := '';
  for v_proof in
    select public.issue_signup_proof('otra@example.test')
    union all select regexp_replace(public.issue_signup_proof('guard_bad@example.test'), '.$', 'x')
    union all select (v_now - 1200)::text || '.' || public._signup_proof_mac('guard_bad@example.test', v_now - 1200)
    union all select (v_now + 3600)::text || '.' || public._signup_proof_mac('guard_bad@example.test', v_now + 3600)
    union all select 'no-es-una-prueba'
  loop
    begin
      insert into auth.users (id, email, raw_user_meta_data)
      values (gen_random_uuid(), 'guard_bad@example.test', jsonb_build_object('username', 'guard_bad', 'signup_proof', v_proof));
      v_ok := false; v_detail := v_detail || ' aceptada: ' || left(v_proof, 20);
      delete from auth.users where email = 'guard_bad@example.test';
    exception when check_violation then null;
    end;
  end loop;
  insert into security_test_results values (24, 'Prueba de otro correo, alterada, caducada (>15 min), futura o basura → rechazada', case when v_ok then 'OK' else 'FALLO' end, coalesce(nullif(v_detail, ''), '5 de 5 rechazadas'));

  -- 25. Cambio de contraseña sin permiso (PUT /auth/v1/user con una sesión robada)
  begin
    update auth.users set encrypted_password = 'hash-nuevo-1' where id = v_id;
    v_ok := false; v_detail := 'se cambió';
  exception when check_violation then v_ok := true; v_detail := sqlerrm;
  end;
  insert into security_test_results values (25, 'Cambio de contraseña sin permiso del servidor → rechazado', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  -- 26. Con permiso → se cambia y el permiso se consume (un segundo cambio vuelve a fallar)
  perform public.issue_password_change_ticket(v_id);
  update auth.users set encrypted_password = 'hash-nuevo-2' where id = v_id;
  v_ok := (select encrypted_password from auth.users where id = v_id) = 'hash-nuevo-2'
      and not exists (select 1 from public.credential_change_tickets where user_id = v_id);
  begin
    update auth.users set encrypted_password = 'hash-nuevo-3' where id = v_id;
    v_ok := false;
  exception when check_violation then null;
  end;
  insert into security_test_results values (26, 'Con permiso del servidor → se cambia una vez; el permiso no se reutiliza', case when v_ok then 'OK' else 'FALLO' end, '');

  -- 27. Permiso caducado → rechazado
  perform public.issue_password_change_ticket(v_id);
  update public.credential_change_tickets set expires_at = now() - interval '1 second' where user_id = v_id;
  begin
    update auth.users set encrypted_password = 'hash-nuevo-4' where id = v_id;
    v_ok := false;
  exception when check_violation then v_ok := true;
  end;
  insert into security_test_results values (27, 'Permiso caducado (>2 min) → rechazado', case when v_ok then 'OK' else 'FALLO' end, '');

  -- 28. Correo: ni cambio directo ni solicitud de cambio; el resto de columnas, libre
  v_ok := true;
  begin
    update auth.users set email = 'robado@example.test' where id = v_id; v_ok := false;
  exception when check_violation then null;
  end;
  begin
    update auth.users set email_change = 'robado@example.test' where id = v_id; v_ok := false;
  exception when check_violation then null;
  end;
  update auth.users set raw_user_meta_data = raw_user_meta_data || '{"x":1}' where id = v_id;
  v_ok := v_ok and (select email from auth.users where id = v_id) = 'guard_ok@example.test';
  insert into security_test_results values (28, 'Cambio o solicitud de cambio de correo → rechazados; otras columnas (inicio de sesión, metadatos) no', case when v_ok then 'OK' else 'FALLO' end, '');

  -- 29. Privilegios: solo el servidor emite pruebas y permisos; nadie lee los secretos
  v_ok := not has_function_privilege('anon', 'public.issue_signup_proof(text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.issue_signup_proof(text)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.issue_signup_proof(text)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.issue_password_change_ticket(uuid)', 'EXECUTE')
      and has_function_privilege('service_role', 'public.issue_password_change_ticket(uuid)', 'EXECUTE')
      and not has_function_privilege('service_role', 'public._signup_proof_mac(text, bigint)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public._signup_proof_valid(text, text)', 'EXECUTE')
      and not has_table_privilege('authenticated', 'public.server_secrets', 'SELECT')
      and not has_table_privilege('anon', 'public.server_secrets', 'SELECT')
      and not has_table_privilege('authenticated', 'public.credential_change_tickets', 'SELECT')
      and not has_table_privilege('authenticated', 'public.auth_guard_config', 'UPDATE');
  insert into security_test_results values (29, 'Solo service_role emite pruebas/permisos; nadie lee el secreto ni la configuración', case when v_ok then 'OK' else 'FALLO' end, '');

  -- 30. Con la exigencia DESACTIVADA (antes de 0004): altas sin prueba funcionan
  --     (código antiguo), pero una prueba que llegue se retira igual
  update public.auth_guard_config set enforce = false where id;
  v_id := gen_random_uuid();
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_id, 'guard_off@example.test', '{"username":"guard_off","signup_proof":"123.abc"}');
  update auth.users set encrypted_password = 'hash-sin-permiso' where id = v_id;
  select raw_user_meta_data into v_meta from auth.users where id = v_id;
  v_ok := not (v_meta ? 'signup_proof');
  insert into security_test_results values (30, 'Exigencia desactivada: compatibilidad con el código anterior, sin guardar la prueba', case when v_ok then 'OK' else 'FALLO' end, v_meta::text);
end $$;

select n as "#", caso, resultado, detalle
from security_test_results
order by n;

rollback;
