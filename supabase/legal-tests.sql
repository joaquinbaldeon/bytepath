-- ===========================================================================
-- BytePath · pruebas de la aceptación de los Términos
--
-- Pegar ENTERO en el SQL Editor de Supabase y ejecutar, después de schema.sql y
-- legal.sql (o setup.sql). Crea cuentas de prueba DENTRO de una transacción que
-- termina en ROLLBACK: no deja rastro.
-- ===========================================================================

begin;

create temporary table legal_test_results (
  n int,
  caso text,
  resultado text,
  detalle text
) on commit drop;

do $$
declare
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_bad uuid := gen_random_uuid();
  v_ok boolean;
  v_detail text;
  v_count int;
  v_row public.legal_acceptances;
begin
  -- Las pruebas 1-16 comprueban el comportamiento con la exigencia ACTIVADA
  -- (tras la migración 0002). La 17 comprueba la fase de transición.
  update public.legal_config set require_terms_on_signup = true where id;

  ---------------------------------------------------------------------------
  -- 1. Alta con la versión vigente → aceptación registrada
  ---------------------------------------------------------------------------
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_a, 'legal_a@example.test', '{"username":"legal_test_a","terms_version":"1.0"}');

  select * into v_row from public.legal_acceptances where user_id = v_a;
  v_ok := found and v_row.document_type = 'terms' and v_row.document_version = '1.0' and v_row.accepted_at is not null;
  insert into legal_test_results values
    (1, 'Crear una cuenta registra la aceptación (terms, 1.0, fecha)', case when v_ok then 'OK' else 'FALLO' end, coalesce(row_to_json(v_row)::text, 'sin fila'));

  -- Solo se guardan esas columnas: nada de IP ni user-agent.
  select count(*) into v_count from information_schema.columns
   where table_schema = 'public' and table_name = 'legal_acceptances';
  insert into legal_test_results values
    (2, 'La tabla solo tiene id, usuario, tipo, versión y fecha', case when v_count = 5 then 'OK' else 'FALLO' end, v_count || ' columnas');

  ---------------------------------------------------------------------------
  -- 3-4. Alta sin aceptar / con una versión no publicada → rechazada entera
  ---------------------------------------------------------------------------
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (v_bad, 'legal_bad@example.test', '{"username":"legal_test_bad"}');
    v_ok := false; v_detail := 'Se creó una cuenta sin aceptar los Términos';
  exception when check_violation then
    v_ok := not exists (select 1 from auth.users where id = v_bad)
        and not exists (select 1 from public.profiles where id = v_bad);
    v_detail := 'Rechazada; sin usuario ni perfil a medias';
  end;
  insert into legal_test_results values (3, 'Sin aceptar los Términos no se crea la cuenta', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (v_bad, 'legal_bad@example.test', '{"username":"legal_test_bad","terms_version":"9.9"}');
    v_ok := false; v_detail := 'Se aceptó una versión inexistente';
  exception when check_violation then
    v_ok := not exists (select 1 from auth.users where id = v_bad);
    v_detail := 'Rechazada';
  end;
  insert into legal_test_results values (4, 'Una versión no publicada se rechaza', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 5-7. Nadie escribe aceptaciones desde el navegador
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_a::text, 'role', 'authenticated')::text, true);

  begin
    set local role authenticated;
    insert into public.legal_acceptances (user_id, document_type, document_version) values (v_a, 'terms', '1.0');
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo insertar su propia aceptación';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  insert into legal_test_results values (5, 'Un usuario no puede insertar aceptaciones', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  begin
    set local role authenticated;
    update public.legal_acceptances set accepted_at = now() - interval '1 year' where user_id = v_a;
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo cambiar la fecha de su aceptación';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  insert into legal_test_results values (6, 'Un usuario no puede modificar su aceptación', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  begin
    set local role authenticated;
    delete from public.legal_acceptances where user_id = v_a;
    reset role;
    v_ok := false; v_detail := 'Un usuario pudo borrar su aceptación';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  insert into legal_test_results values (7, 'Un usuario no puede borrar su aceptación', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 8. RLS: cada uno ve solo lo suyo
  ---------------------------------------------------------------------------
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_b, 'legal_b@example.test', '{"username":"legal_test_b","terms_version":"1.0"}');

  set local role authenticated;
  select count(*) into v_count from public.legal_acceptances;
  reset role;
  insert into legal_test_results values
    (8, 'Un usuario solo ve sus propias aceptaciones (RLS)', case when v_count = 1 then 'OK' else 'FALLO' end, v_count || ' filas visibles');

  begin
    set local role anon;
    select count(*) into v_count from public.legal_acceptances;
    reset role;
    v_ok := false; v_detail := 'anon pudo leer la tabla';
  exception when insufficient_privilege then
    reset role; v_ok := true; v_detail := 'permission denied';
  end;
  insert into legal_test_results values (9, 'Sin sesión no se leen aceptaciones', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  ---------------------------------------------------------------------------
  -- 10-12. Estructura
  ---------------------------------------------------------------------------
  begin
    insert into public.legal_acceptances (user_id, document_type, document_version) values (v_a, 'terms', '1.0');
    v_ok := false; v_detail := 'Se duplicó la aceptación';
  exception when unique_violation then
    v_ok := true; v_detail := 'Rechazada por la restricción única';
  end;
  insert into legal_test_results values (10, 'Una misma versión se registra una sola vez por usuario', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  v_ok := not has_function_privilege('authenticated', 'public.record_signup_terms()', 'EXECUTE')
      and not has_function_privilege('anon', 'public.record_signup_terms()', 'EXECUTE');
  insert into legal_test_results values (11, 'La función del trigger no es invocable desde el cliente', case when v_ok then 'OK' else 'FALLO' end, '');

  delete from auth.users where id = v_a;
  v_ok := not exists (select 1 from public.legal_acceptances where user_id = v_a);
  insert into legal_test_results values (12, 'Al eliminar la cuenta se eliminan sus aceptaciones', case when v_ok then 'OK' else 'FALLO' end, '');

  ---------------------------------------------------------------------------
  -- 13-16. Versión futura, versión nueva vigente, versión anterior
  ---------------------------------------------------------------------------
  insert into public.legal_documents (document_type, version, published_at)
  values ('terms', '9.1', (now() at time zone 'America/Lima')::date + 30);

  v_ok := public.current_legal_version('terms') = '1.0';
  insert into legal_test_results values (13, 'Una versión con fecha futura existe pero no es la vigente', case when v_ok then 'OK' else 'FALLO' end, public.current_legal_version('terms'));

  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (v_bad, 'legal_future@example.test', '{"username":"legal_future","terms_version":"9.1"}');
    v_ok := false; v_detail := 'Se aceptó en el alta una versión que aún no rige';
  exception when check_violation then
    v_ok := true; v_detail := 'Rechazada';
  end;
  insert into legal_test_results values (14, 'El alta no puede aceptar una versión futura', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  -- La 9.1 pasa a regir: la 1.0 deja de ser aceptable, pero lo ya aceptado se conserva.
  -- Misma fecha que la vigente o posterior: rige la de fecha más reciente y, si
  -- empatan, la de número más alto.
  update public.legal_documents set published_at = (now() at time zone 'America/Lima')::date
   where document_type = 'terms' and version = '9.1';
  select accepted_at::text into v_detail from public.legal_acceptances where user_id = v_b and document_version = '1.0';
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (v_bad, 'legal_old@example.test', '{"username":"legal_old","terms_version":"1.0"}');
    v_ok := false;
  exception when check_violation then
    v_ok := true;
  end;
  v_ok := v_ok
    and public.current_legal_version('terms') = '9.1'
    and (select accepted_at::text from public.legal_acceptances where user_id = v_b and document_version = '1.0') = v_detail;
  insert into legal_test_results values (15, 'Al regir una versión nueva, la anterior ya no se acepta y las aceptaciones antiguas quedan intactas', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  delete from public.legal_documents where version = '9.1';

  ---------------------------------------------------------------------------
  -- 16-17. Fase de transición: exigencia DESACTIVADA (valor inicial)
  ---------------------------------------------------------------------------
  update public.legal_config set require_terms_on_signup = false where id;
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (v_bad, 'legal_legacy@example.test', '{"username":"legal_legacy"}');
    v_ok := exists (select 1 from public.profiles where id = v_bad)
        and not exists (select 1 from public.legal_acceptances where user_id = v_bad);
    v_detail := 'Alta sin versión: cuenta creada, sin aceptación';
  exception when others then
    v_ok := false; v_detail := SQLERRM;
  end;
  insert into legal_test_results values (16, 'Transición: el código antiguo (sin terms_version) sigue pudiendo registrar', case when v_ok then 'OK' else 'FALLO' end, v_detail);

  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (gen_random_uuid(), 'legal_new@example.test', '{"username":"legal_newcode","terms_version":"1.0"}');
    select count(*) into v_count from public.legal_acceptances a join auth.users u on u.id = a.user_id where u.email = 'legal_new@example.test';
    v_ok := v_count = 1;
  exception when others then
    v_ok := false;
  end;
  insert into legal_test_results values (17, 'Transición: el código nuevo ya deja su aceptación registrada', case when v_ok then 'OK' else 'FALLO' end, v_count || ' filas');
end $$;

select n as "#", caso, resultado, detalle
from legal_test_results
order by n;

rollback;
