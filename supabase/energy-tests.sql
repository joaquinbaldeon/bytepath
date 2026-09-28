-- ===========================================================================
-- BytePath · pruebas de la energía (regeneración, lectura y permisos)
--
-- Pegar ENTERO en el SQL Editor de Supabase y ejecutar, después de
-- schema.sql, energy.sql, economy.sql y progress.sql.
--
-- Lo que se GASTA de energía (al completar una lección) se prueba en
-- progress-tests.sql, que es donde vive esa operación. Aquí: cómo se
-- regenera, cómo se lee, y quién puede tocarla.
--
-- NO DEJA RASTRO: todo ocurre dentro de una transacción que termina en
-- ROLLBACK. Usa la primera cuenta que exista en auth.users.
--
-- Al final imprime una tabla con una fila por caso. Todas deben decir OK.
-- ===========================================================================

begin;

create temporary table energy_test_results (
  n int,
  caso text,
  resultado text,
  detalle text
) on commit drop;

do $$
declare
  v_user uuid;
  v_state jsonb;
  v_calc record;
  v_n int := 0;
  v_ok boolean;
  v_detail text;
  v_count int;
begin
  select id into v_user from auth.users order by created_at limit 1;

  if v_user is null then
    insert into energy_test_results values
      (0, 'Requisito previo', 'FALLO',
       'No hay ninguna cuenta en auth.users. Regístrate en la aplicación y vuelve a ejecutar esto.');
    return;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);

  delete from public.subscriptions where user_id = v_user;
  delete from public.user_energy where user_id = v_user;

  ---------------------------------------------------------------------------
  -- Regeneración: función pura, aislada de todo lo demás.
  ---------------------------------------------------------------------------
  v_n := 1;
  select * into v_calc from public.compute_energy_regen(1::smallint, now() - interval '3 hours');
  v_ok := v_calc.remaining = 2;
  insert into energy_test_results values
    (v_n, '1 de energía + 3 horas → 2', case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  v_n := 2;
  select * into v_calc from public.compute_energy_regen(1::smallint, now() - interval '6 hours');
  v_ok := v_calc.remaining = 3;
  insert into energy_test_results values
    (v_n, '1 + 6 horas → 3', case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  v_n := 3;
  select * into v_calc from public.compute_energy_regen(1::smallint, now() - interval '9 hours');
  v_ok := v_calc.remaining = 4;
  insert into energy_test_results values
    (v_n, '1 + 9 horas → 4', case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  v_n := 4;
  select * into v_calc from public.compute_energy_regen(0::smallint, now() - interval '24 hours');
  v_ok := v_calc.remaining = 4;
  insert into energy_test_results values
    (v_n, '0 + 24 horas → 4, no se acumula más allá del tope',
     case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  v_n := 5;
  select * into v_calc from public.compute_energy_regen(4::smallint, now() - interval '100 hours');
  v_ok := v_calc.remaining = 4;
  insert into energy_test_results values
    (v_n, '4 no supera 4 pase el tiempo que pase', case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  v_n := 6;
  select * into v_calc from public.compute_energy_regen(2::smallint, now() - interval '2 hours 59 minutes');
  v_ok := v_calc.remaining = 2;
  insert into energy_test_results values
    (v_n, 'Antes de 3 horas no hay regeneración', case when v_ok then 'OK' else 'FALLO' end, 'remaining=' || v_calc.remaining);

  -- El tiempo sobrante hacia el siguiente tick no se pierde: 3h50m dan 1 y
  -- el ancla avanza solo 3h, así que faltan 2h10m para el siguiente.
  v_n := 7;
  select * into v_calc from public.compute_energy_regen(1::smallint, now() - interval '3 hours 50 minutes');
  v_ok := v_calc.remaining = 2
      and v_calc.last_regen_at between now() - interval '50 minutes 1 second' and now() - interval '49 minutes 59 seconds';
  insert into energy_test_results values
    (v_n, 'El tiempo sobrante hacia el siguiente tick se conserva',
     case when v_ok then 'OK' else 'FALLO' end, v_calc.last_regen_at::text);

  ---------------------------------------------------------------------------
  -- Lectura del estado (get_account_state): sin escribir nada.
  ---------------------------------------------------------------------------
  v_n := 8;
  v_state := public.get_account_state();
  v_ok := (v_state ->> 'signed_in')::boolean
      and (v_state ->> 'premium')::boolean = false
      and (v_state ->> 'remaining')::int = 4
      and (v_state ->> 'limit')::int = 4
      and v_state ->> 'next_energy_at' is null;
  insert into energy_test_results values
    (v_n, 'Un Free nuevo empieza con 4/4', case when v_ok then 'OK' else 'FALLO' end, v_state::text);

  v_n := 9;
  insert into public.user_energy (user_id, energy_remaining, last_regen_at)
  values (v_user, 0, now() - interval '9 hours');
  v_state := public.get_account_state();
  select (energy_remaining = 0) into v_ok from public.user_energy where user_id = v_user;
  v_ok := v_ok and (v_state ->> 'remaining')::int = 3;
  insert into energy_test_results values
    (v_n, 'Leer ve la regeneración (0 + 9h = 3) sin escribirla',
     case when v_ok then 'OK' else 'FALLO' end, v_state::text);

  v_n := 10;
  update public.user_energy set energy_remaining = 2, last_regen_at = now() - interval '1 hour' where user_id = v_user;
  v_state := public.get_account_state();
  v_ok := (v_state ->> 'remaining')::int = 2
      and (v_state ->> 'next_energy_at')::timestamptz between now() + interval '1 hour 59 minutes' and now() + interval '2 hours 1 minute';
  insert into energy_test_results values
    (v_n, 'next_energy_at es el ancla + 3 horas', case when v_ok then 'OK' else 'FALLO' end, v_state::text);

  v_n := 11;
  insert into public.subscriptions (user_id, status, plan) values (v_user, 'active', 'premium_test');
  v_state := public.get_account_state();
  v_ok := (v_state ->> 'premium')::boolean and v_state ->> 'remaining' is null and v_state ->> 'limit' is null;
  insert into energy_test_results values
    (v_n, 'Premium: energía ilimitada (null)', case when v_ok then 'OK' else 'FALLO' end, v_state::text);

  v_n := 12;
  update public.subscriptions set status = 'canceled', current_period_end = now() - interval '1 day' where user_id = v_user;
  v_ok := not public.is_premium(v_user);
  insert into energy_test_results values
    (v_n, 'Una suscripción vencida vuelve a Free', case when v_ok then 'OK' else 'FALLO' end, '');
  delete from public.subscriptions where user_id = v_user;

  v_n := 13;
  perform set_config('request.jwt.claims', '', true);
  v_state := public.get_account_state();
  v_ok := (v_state ->> 'signed_in')::boolean = false and v_state ->> 'remaining' is null;
  insert into energy_test_results values
    (v_n, 'Sin sesión no hay energía que enseñar', case when v_ok then 'OK' else 'FALLO' end, v_state::text);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);

  ---------------------------------------------------------------------------
  -- La tabla no admite valores imposibles.
  ---------------------------------------------------------------------------
  v_n := 14;
  begin
    update public.user_energy set energy_remaining = 5 where user_id = v_user;
    v_ok := false; v_detail := 'Aceptó 5';
  exception when check_violation then
    v_ok := true; v_detail := 'Rechazado por el CHECK';
  end;
  insert into energy_test_results values (v_n, 'Imposible más de 4', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 15;
  begin
    update public.user_energy set energy_remaining = -1 where user_id = v_user;
    v_ok := false; v_detail := 'Aceptó -1';
  exception when check_violation then
    v_ok := true; v_detail := 'Rechazado por el CHECK';
  end;
  insert into energy_test_results values (v_n, 'Imposible energía negativa', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- Permisos: nadie escribe su propia energía ni su propio progreso.
  ---------------------------------------------------------------------------
  v_n := 16;
  select count(*) into v_count
  from pg_policies
  where schemaname = 'public'
    and tablename in ('user_energy', 'subscriptions', 'lesson_activations')
    and cmd <> 'SELECT';
  v_ok := v_count = 0;
  insert into energy_test_results values
    (v_n, 'Ninguna política de escritura sobre energía, suscripciones ni progreso',
     case when v_ok then 'OK' else 'FALLO' end, v_count || ' encontradas');

  v_n := 17;
  select count(*) into v_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('user_energy', 'subscriptions', 'lesson_activations') and c.relrowsecurity;
  v_ok := v_count = 3;
  insert into energy_test_results values
    (v_n, 'RLS activo en las tres tablas', case when v_ok then 'OK' else 'FALLO' end, v_count || ' de 3');

  v_n := 18;
  select count(*) into v_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('user_energy', 'subscriptions', 'lesson_activations')
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  v_ok := v_count = 0;
  insert into energy_test_results values
    (v_n, 'anon y authenticated no tienen permisos de escritura sobre esas tablas',
     case when v_ok then 'OK' else 'FALLO' end, v_count || ' permisos');

  -- Y de verdad: un usuario con sesión intentando escribir directamente.
  v_n := 19;
  begin
    set local role authenticated;
    update public.user_energy set energy_remaining = 4 where user_id = v_user;
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo escribir su energía';
  exception when insufficient_privilege then
    reset role;
    v_ok := true; v_detail := 'permission denied, como debe ser';
  end;
  insert into energy_test_results values (v_n, 'Un usuario no puede rellenarse la energía', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 20;
  begin
    set local role authenticated;
    insert into public.subscriptions (user_id, status) values (v_user, 'active');
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo hacerse Premium';
  exception when insufficient_privilege then
    reset role;
    v_ok := true; v_detail := 'permission denied, como debe ser';
  end;
  insert into energy_test_results values (v_n, 'Un usuario no puede hacerse Premium', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- Funciones: quién puede llamar a qué, y search_path.
  ---------------------------------------------------------------------------
  v_n := 21;
  select count(*) into v_count
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) cfg where cfg like 'search\_path=%');
  v_ok := v_count = 0;
  insert into energy_test_results values
    (v_n, 'Toda función SECURITY DEFINER fija su search_path',
     case when v_ok then 'OK' else 'FALLO' end, v_count || ' sin fijar');

  v_n := 22;
  v_ok := not has_function_privilege('authenticated', 'public.is_premium(uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.is_premium(uuid)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.compute_energy_regen(smallint,timestamptz)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public._energy_view(uuid)', 'EXECUTE');
  insert into energy_test_results values
    (v_n, 'is_premium, compute_energy_regen y _energy_view no son invocables desde el cliente',
     case when v_ok then 'OK' else 'FALLO' end, '');

  v_n := 23;
  v_ok := has_function_privilege('authenticated', 'public.get_account_state(text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.get_account_state(text,text)', 'EXECUTE');
  insert into energy_test_results values
    (v_n, 'get_account_state (solo lectura) es para quien tiene sesión',
     case when v_ok then 'OK' else 'FALLO' end, '');

  -- La energía ya no se gasta al entrar: no existe ninguna función para ello.
  v_n := 24;
  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'consume_lesson_energy';
  v_ok := v_count = 0;
  insert into energy_test_results values
    (v_n, 'consume_lesson_energy ya no existe (no se cobra al entrar)',
     case when v_ok then 'OK' else 'FALLO' end, v_count || ' encontradas');
end $$;

select n as "#", caso, resultado, detalle
from energy_test_results
order by n;

-- Nada de lo anterior se guarda.
rollback;


-- ===========================================================================
-- Conceder Premium a mano, para probar
--
-- Vive aquí, con las pruebas, y no en energy.sql, porque es una operación de
-- pruebas: escribe datos de una cuenta concreta.
--
-- Está comentado. Copia las líneas, pega tu UUID (panel → Authentication →
-- Users → columna UID) y ejecútalas sueltas.
--
--   insert into public.subscriptions (user_id, status, plan)
--   values ('<pega-aqui-tu-uuid>', 'active', 'premium_manual')
--   on conflict (user_id) do update
--     set status = 'active', plan = 'premium_manual', current_period_end = null;
--
-- Para volver a Free:
--
--   delete from public.subscriptions where user_id = '<pega-aqui-tu-uuid>';
--
-- No hay atajo en el código que sustituya a esto: ser Premium es tener esta
-- fila, y nada más. El día que haya cobros, el webhook del proveedor escribirá
-- exactamente esta misma fila con la clave service_role.
-- ===========================================================================
