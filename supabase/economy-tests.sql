-- ===========================================================================
-- BytePath · pruebas de tokens y recarga de energía
--
-- Pegar ENTERO en el SQL Editor de Supabase y ejecutar, después de
-- schema.sql, energy.sql, economy.sql y progress.sql.
--
-- Los +10 tokens por completar una lección se prueban en progress-tests.sql
-- (los reparte `complete_lesson`). Aquí: la recarga con tokens y la seguridad
-- de las tablas de tokens.
--
-- NO DEJA RASTRO: todo ocurre dentro de una transacción que termina en
-- ROLLBACK. Usa la primera cuenta que exista en auth.users.
-- ===========================================================================

begin;

create temporary table economy_test_results (
  n int,
  caso text,
  resultado text,
  detalle text
) on commit drop;

do $$
declare
  v_user uuid;
  v_out jsonb;
  v_state jsonb;
  v_n int := 0;
  v_ok boolean;
  v_detail text;
  v_count int;
begin
  select id into v_user from auth.users order by created_at limit 1;

  if v_user is null then
    insert into economy_test_results values
      (0, 'Requisito previo', 'FALLO',
       'No hay ninguna cuenta en auth.users. Regístrate en la aplicación y vuelve a ejecutar esto.');
    return;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);

  delete from public.token_transactions where user_id = v_user;
  delete from public.user_tokens where user_id = v_user;
  delete from public.subscriptions where user_id = v_user;
  delete from public.user_energy where user_id = v_user;

  ---------------------------------------------------------------------------
  -- 1. Recarga con 110 y energía a 0 → quedan 10 tokens y 4/4
  ---------------------------------------------------------------------------
  v_n := 1;
  insert into public.user_tokens (user_id, balance) values (v_user, 110);
  insert into public.user_energy (user_id, energy_remaining, last_regen_at) values (v_user, 0, now());
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean and (v_out ->> 'tokens')::int = 10 and (v_out ->> 'remaining')::int = 4;
  insert into economy_test_results values
    (v_n, 'Recargar con 110 deja 10 tokens y 4/4', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 2. Con 99 → rechazada, sin tocar nada
  ---------------------------------------------------------------------------
  v_n := 2;
  update public.user_tokens set balance = 99 where user_id = v_user;
  update public.user_energy set energy_remaining = 3, last_regen_at = now() where user_id = v_user;
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean = false and (v_out ->> 'reason') = 'insufficient_tokens'
      and (v_out ->> 'tokens')::int = 99 and (v_out ->> 'remaining')::int = 3;
  insert into economy_test_results values
    (v_n, 'Recargar con 99 se rechaza y no toca nada', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 3. Con 100 y 3/4 → 0 tokens y 4/4
  ---------------------------------------------------------------------------
  v_n := 3;
  update public.user_tokens set balance = 100 where user_id = v_user;
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean and (v_out ->> 'tokens')::int = 0 and (v_out ->> 'remaining')::int = 4;
  insert into economy_test_results values
    (v_n, 'Recargar con 100 y 3/4 deja 0 tokens y 4/4', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 4. Con 100 y 4/4 → rechazada (ya está lleno), sin gastar
  ---------------------------------------------------------------------------
  v_n := 4;
  update public.user_tokens set balance = 100 where user_id = v_user;
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean = false and (v_out ->> 'reason') = 'energy_full' and (v_out ->> 'tokens')::int = 100;
  insert into economy_test_results values
    (v_n, 'Recargar con 4/4 se rechaza sin gastar tokens', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  v_n := 5;
  select exists (select 1 from public.token_transactions where user_id = v_user and type = 'energy_refill' and amount = -100)
    into v_ok;
  insert into economy_test_results values
    (v_n, 'La recarga queda anotada como energy_refill de -100', case when v_ok then 'OK' else 'FALLO' end, '');

  ---------------------------------------------------------------------------
  -- 6. Una regeneración pendiente cuenta antes de decidir si "ya está lleno"
  --    (0 + 3h = 1, no 4: la recarga sí procede)
  ---------------------------------------------------------------------------
  v_n := 6;
  update public.user_energy set energy_remaining = 0, last_regen_at = now() - interval '3 hours' where user_id = v_user;
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean and (v_out ->> 'remaining')::int = 4 and (v_out ->> 'tokens')::int = 0;
  insert into economy_test_results values
    (v_n, 'La regeneración pendiente se cuenta antes de recargar', case when v_ok then 'OK' else 'FALLO' end, v_out::text);

  ---------------------------------------------------------------------------
  -- 7. Premium y sin sesión
  ---------------------------------------------------------------------------
  v_n := 7;
  insert into public.subscriptions (user_id, status, plan) values (v_user, 'active', 'premium_test');
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean = false and (v_out ->> 'reason') = 'premium_unlimited';
  insert into economy_test_results values
    (v_n, 'Premium no gasta tokens en recargar', case when v_ok then 'OK' else 'FALLO' end, v_out::text);
  delete from public.subscriptions where user_id = v_user;

  v_n := 8;
  perform set_config('request.jwt.claims', '', true);
  v_out := public.refill_energy_with_tokens();
  v_ok := (v_out ->> 'refilled')::boolean = false and (v_out ->> 'reason') = 'not_signed_in';
  insert into economy_test_results values
    (v_n, 'Sin sesión, la recarga no hace nada', case when v_ok then 'OK' else 'FALLO' end, v_out::text);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);

  ---------------------------------------------------------------------------
  -- 9. get_account_state informa del saldo
  ---------------------------------------------------------------------------
  v_n := 9;
  update public.user_tokens set balance = 35 where user_id = v_user;
  v_state := public.get_account_state();
  v_ok := (v_state ->> 'tokens')::int = 35;
  insert into economy_test_results values
    (v_n, 'get_account_state incluye el saldo de tokens', case when v_ok then 'OK' else 'FALLO' end, v_state::text);

  ---------------------------------------------------------------------------
  -- Seguridad de las tablas de tokens
  ---------------------------------------------------------------------------
  v_n := 10;
  select count(*) into v_count from pg_policies
   where schemaname = 'public' and tablename in ('user_tokens', 'token_transactions') and cmd <> 'SELECT';
  v_ok := v_count = 0;
  insert into economy_test_results values
    (v_n, 'Ninguna política permite escribir tokens desde el cliente', case when v_ok then 'OK' else 'FALLO' end, v_count || ' encontradas');

  v_n := 11;
  select count(*) into v_count from information_schema.role_table_grants
   where table_schema = 'public' and table_name in ('user_tokens', 'token_transactions')
     and grantee in ('anon', 'authenticated') and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  v_ok := v_count = 0;
  insert into economy_test_results values
    (v_n, 'anon y authenticated no tienen permisos de escritura sobre tokens', case when v_ok then 'OK' else 'FALLO' end, v_count || ' permisos');

  v_n := 12;
  begin
    set local role authenticated;
    update public.user_tokens set balance = 5000 where user_id = v_user;
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo darse 5000 tokens';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied, como debe ser';
  end;
  insert into economy_test_results values (v_n, 'Un usuario no puede otorgarse tokens', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 13;
  begin
    set local role authenticated;
    insert into public.token_transactions (user_id, amount, type, course_slug, lesson_slug)
    values (v_user, 10, 'lesson_completion', 'x', 'y');
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo escribir en el ledger';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied, como debe ser';
  end;
  insert into economy_test_results values (v_n, 'Un usuario no puede escribir en el ledger', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 14;
  select count(*) into v_count from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('user_tokens', 'token_transactions') and c.relrowsecurity;
  v_ok := v_count = 2;
  insert into economy_test_results values (v_n, 'RLS activo en las dos tablas de tokens', case when v_ok then 'OK' else 'FALLO' end, v_count || ' de 2');

  -- La garantía de "una vez por lección" es el índice, no una comprobación.
  v_n := 15;
  insert into public.token_transactions (user_id, amount, type, course_slug, lesson_slug)
  values (v_user, 10, 'lesson_completion', '__eco__', 'l1');
  begin
    insert into public.token_transactions (user_id, amount, type, course_slug, lesson_slug)
    values (v_user, 10, 'lesson_completion', '__eco__', 'l1');
    v_ok := false; v_detail := 'El índice único no impidió el duplicado';
  exception when unique_violation then
    v_ok := true; v_detail := 'Rechazado por el índice único parcial';
  end;
  insert into economy_test_results values (v_n, 'No se puede duplicar la recompensa de una lección', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 16;
  begin
    insert into public.token_transactions (user_id, amount, type) values (v_user, 10, 'lesson_completion');
    v_ok := false; v_detail := 'Aceptó una recompensa sin lección';
  exception when check_violation then
    v_ok := true; v_detail := 'Rechazada por el CHECK de coherencia';
  end;
  insert into economy_test_results values (v_n, 'Una recompensa exige curso y lección', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_n := 17;
  v_ok := has_function_privilege('authenticated', 'public.refill_energy_with_tokens()', 'EXECUTE')
      and not has_function_privilege('anon', 'public.refill_energy_with_tokens()', 'EXECUTE');
  insert into economy_test_results values (v_n, 'La recarga es solo para quien tiene sesión', case when v_ok then 'OK' else 'FALLO' end, '');
end $$;

select n as "#", caso, resultado, detalle
from economy_test_results
order by n;

-- Nada de lo anterior se guarda.
rollback;
