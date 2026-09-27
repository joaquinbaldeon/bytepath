-- ===========================================================================
-- BytePath · pruebas de progreso, completado y energía
--
-- Pegar ENTERO en el SQL Editor de Supabase y ejecutar, después de
-- schema.sql, energy.sql, economy.sql y progress.sql.
--
-- Cubre: cobro de energía al completar, requisitos (quiz, desafío), progresión
-- lineal, idempotencia, Premium, regeneración, y —sobre todo— que una llamada
-- directa desde el navegador no pueda saltarse nada.
--
-- NO DEJA RASTRO: todo ocurre dentro de una transacción que termina en
-- ROLLBACK. Usa la primera cuenta que exista en auth.users.
--
-- La CONCURRENCIA (dos peticiones a la vez) no se puede probar aquí, porque
-- este guión corre en una sola conexión. Ver supabase/README.md.
-- ===========================================================================

begin;

create temporary table progress_test_results (
  n int,
  caso text,
  resultado text,
  detalle text
) on commit drop;

create function pg_temp.chk(p_n int, p_caso text, p_ok boolean, p_detalle text default '')
returns void language sql as $$
  insert into progress_test_results values (p_n, p_caso, case when p_ok then 'OK' else 'FALLO' end, p_detalle);
$$;

do $$
declare
  v_user uuid;
  v_other uuid := gen_random_uuid();
  v_out jsonb;
  v_n int := 0;
  v_row public.lesson_activations%rowtype;
  v_energy int;
  v_tokens int;
  v_count int;
  v_detail text;
  v_ok boolean;
  v_before int;
  v_fn text;
  qs text[] := array['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
  q text;
  v_state jsonb := '{"v":1,"order":["q1","q2","q3","q4","q5","q6"],"currentRound":["q4","q5","q6"],"nextRound":[],"roundNumber":1,"roundTotal":6,"results":{}}'::jsonb;
begin
  select id into v_user from auth.users order by created_at limit 1;

  if v_user is null then
    perform pg_temp.chk(0, 'Requisito previo', false,
      'No hay ninguna cuenta en auth.users. Regístrate en la aplicación y vuelve a ejecutar esto.');
    return;
  end if;

  -- Punto de partida limpio: cuenta Free con la energía llena.
  delete from public.lesson_activations where user_id = v_user and course_slug = '__t__';
  delete from public.token_transactions where user_id = v_user;
  delete from public.user_tokens where user_id = v_user;
  delete from public.subscriptions where user_id = v_user;
  delete from public.user_energy where user_id = v_user;
  insert into public.user_energy (user_id, energy_remaining, last_regen_at) values (v_user, 6, now());

  ---------------------------------------------------------------------------
  -- TEST 5 · Lección 1 sin completar → lección 2 bloqueada
  ---------------------------------------------------------------------------
  v_out := public.start_lesson(v_user, '__t__', 'l2', 'l1');
  perform pg_temp.chk(5, 'Lección 2 bloqueada mientras la 1 no esté completada',
    (v_out ->> 'started')::boolean = false and (v_out ->> 'reason') = 'locked'
    and not exists (select 1 from public.lesson_activations where user_id = v_user and lesson_slug = 'l2'),
    v_out::text);

  v_out := public.start_lesson(v_user, '__t__', 'l1', null);
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  perform pg_temp.chk(12, 'Iniciar una lección la deja EN PROGRESO (fila sin completed_at)',
    (v_out ->> 'started')::boolean and v_row.completed_at is null and v_row.quiz_status = 'not_started',
    v_out::text);

  -- Iniciar es gratis: estudiar no gasta energía.
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(13, 'Estudiar no gasta energía', v_energy = 6, 'energía=' || v_energy);

  -- Iniciar dos veces es iniciar una.
  v_out := public.start_lesson(v_user, '__t__', 'l1', null);
  select count(*) into v_count from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  perform pg_temp.chk(14, 'Iniciar dos veces no duplica la fila', v_count = 1, v_count || ' filas');

  ---------------------------------------------------------------------------
  -- Requisitos: sin quiz superado no se completa, y no cuesta nada intentarlo
  ---------------------------------------------------------------------------
  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  perform pg_temp.chk(15, 'Completar sin haber hecho el quiz se rechaza (quiz_pending)',
    (v_out ->> 'completed')::boolean = false and (v_out ->> 'reason') = 'quiz_pending'
    and v_energy = 6 and v_row.completed_at is null and coalesce((v_out ->> 'tokens')::int, 0) = 0,
    v_out::text);

  ---------------------------------------------------------------------------
  -- TEST 6 · Quiz incompleto → lección 2 bloqueada
  ---------------------------------------------------------------------------
  v_out := public.record_quiz_answer(v_user, '__t__', 'l1', 'q1', false, qs);
  perform pg_temp.chk(16, 'Una respuesta fallada no cuenta pero deja el quiz EN CURSO',
    (v_out ->> 'quiz_status') = 'in_progress' and (v_out ->> 'solved')::int = 0, v_out::text);

  foreach q in array array['q1', 'q2', 'q3', 'q4', 'q5'] loop
    v_out := public.record_quiz_answer(v_user, '__t__', 'l1', q, true, qs);
  end loop;

  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  perform pg_temp.chk(6, 'Quiz incompleto (5 de 6): la lección no se completa',
    (v_out ->> 'reason') = 'quiz_pending' and (v_out ->> 'completed')::boolean = false, v_out::text);

  v_out := public.start_lesson(v_user, '__t__', 'l2', 'l1');
  perform pg_temp.chk(17, 'Con el quiz incompleto, la lección 2 sigue bloqueada',
    (v_out ->> 'reason') = 'locked', v_out::text);

  ---------------------------------------------------------------------------
  -- Quiz superado pero desafío sin resolver
  ---------------------------------------------------------------------------
  v_out := public.record_quiz_answer(v_user, '__t__', 'l1', 'q6', true, qs);
  perform pg_temp.chk(18, 'Con las 6 acertadas el quiz queda superado',
    (v_out ->> 'quiz_status') = 'completed', v_out::text);

  -- Acertar dos veces la misma no la cuenta dos veces.
  v_out := public.record_quiz_answer(v_user, '__t__', 'l1', 'q6', true, qs);
  perform pg_temp.chk(19, 'Repetir una respuesta acertada no suma', (v_out ->> 'solved')::int = 6, v_out::text);

  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  perform pg_temp.chk(20, 'Quiz superado pero desafío sin resolver: se rechaza (challenge_pending)',
    (v_out ->> 'reason') = 'challenge_pending' and (v_out ->> 'completed')::boolean = false, v_out::text);

  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(21, 'Ninguno de esos rechazos ha gastado energía', v_energy = 6, 'energía=' || v_energy);

  ---------------------------------------------------------------------------
  -- TEST 1 · 6 de energía → completar → 5
  ---------------------------------------------------------------------------
  perform public.record_challenge_pass(v_user, '__t__', 'l1');
  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  perform pg_temp.chk(1, 'TEST 1: 6 de energía → completar la lección → 5, +15 tokens, completed_at',
    (v_out ->> 'completed')::boolean and (v_out ->> 'spent')::boolean and (v_out ->> 'awarded')::boolean
    and v_energy = 5 and (v_out ->> 'remaining')::int = 5 and v_tokens = 15 and v_row.completed_at is not null,
    v_out::text);

  ---------------------------------------------------------------------------
  -- TEST 7 · Lección 1 completada → lección 2 desbloqueada
  ---------------------------------------------------------------------------
  v_out := public.start_lesson(v_user, '__t__', 'l2', 'l1');
  perform pg_temp.chk(7, 'TEST 7: completada la 1, la lección 2 se desbloquea', (v_out ->> 'started')::boolean, v_out::text);

  ---------------------------------------------------------------------------
  -- TEST 8 · Doble clic / reintento: solo -1 y solo +15
  ---------------------------------------------------------------------------
  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  v_out := public.complete_lesson(v_user, '__t__', 'l1', null, true, true);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  select count(*) into v_count from public.token_transactions where user_id = v_user and lesson_slug = 'l1';
  perform pg_temp.chk(8, 'TEST 8: completar tres veces la misma lección → solo -1 energía y solo +15 tokens',
    (v_out ->> 'reason') = 'already_completed' and (v_out ->> 'spent')::boolean = false
    and v_energy = 5 and v_tokens = 15 and v_count = 1,
    'energía=' || v_energy || ' tokens=' || v_tokens || ' movimientos=' || v_count);

  ---------------------------------------------------------------------------
  -- TEST 2 · 5 → completar la segunda → 4
  ---------------------------------------------------------------------------
  foreach q in array qs loop
    perform public.record_quiz_answer(v_user, '__t__', 'l2', q, true, qs);
  end loop;
  v_out := public.complete_lesson(v_user, '__t__', 'l2', 'l1', true, false);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(2, 'TEST 2: 5 de energía → completar la segunda → 4', (v_out ->> 'completed')::boolean and v_energy = 4, 'energía=' || v_energy);

  ---------------------------------------------------------------------------
  -- TEST 3 · 0 de energía: se puede estudiar y avanzar el quiz, pero no completar
  ---------------------------------------------------------------------------
  perform public.start_lesson(v_user, '__t__', 'l3', 'l2');
  update public.user_energy set energy_remaining = 0, last_regen_at = now() where user_id = v_user;

  v_out := public.record_quiz_answer(v_user, '__t__', 'l3', 'q1', true, qs);
  perform pg_temp.chk(22, 'Con 0 de energía se puede seguir estudiando (el quiz avanza)', (v_out ->> 'recorded')::boolean, v_out::text);
  foreach q in array array['q2', 'q3', 'q4', 'q5', 'q6'] loop
    perform public.record_quiz_answer(v_user, '__t__', 'l3', q, true, qs);
  end loop;

  select balance into v_before from public.user_tokens where user_id = v_user;
  v_out := public.complete_lesson(v_user, '__t__', 'l3', 'l2', true, false);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l3';
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  perform pg_temp.chk(3, 'TEST 3: 0 de energía → completar se rechaza (no_energy); la lección sigue EN PROGRESO',
    (v_out ->> 'reason') = 'no_energy' and (v_out ->> 'completed')::boolean = false
    and v_energy = 0 and v_row.completed_at is null and v_tokens = v_before
    and (v_out ->> 'next_energy_at') is not null,
    v_out::text);

  v_out := public.start_lesson(v_user, '__t__', 'l4', 'l3');
  perform pg_temp.chk(23, 'Sin completar la 3 (aunque sea por falta de energía), la 4 sigue bloqueada por PROGRESO',
    (v_out ->> 'reason') = 'locked', v_out::text);

  -- La energía nunca queda negativa, por muchas veces que se insista.
  for i in 1..5 loop
    perform public.complete_lesson(v_user, '__t__', 'l3', 'l2', true, false);
  end loop;
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(24, 'Insistir con 0 de energía no la deja negativa', v_energy = 0, 'energía=' || v_energy);

  ---------------------------------------------------------------------------
  -- TEST 4 · 0 → esperar 3 horas → 1 → completar → 0
  ---------------------------------------------------------------------------
  update public.user_energy set last_regen_at = now() - interval '3 hours 1 minute' where user_id = v_user;
  v_out := public.complete_lesson(v_user, '__t__', 'l3', 'l2', true, false);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(4, 'TEST 4: 0 → pasan 3 horas → 1 → completar → 0',
    (v_out ->> 'completed')::boolean and (v_out ->> 'spent')::boolean and v_energy = 0, v_out::text);

  ---------------------------------------------------------------------------
  -- TEST 12 · Regeneración: +1 cada 3 horas, máximo 6
  ---------------------------------------------------------------------------
  perform public.start_lesson(v_user, '__t__', 'l4', 'l3');
  update public.user_energy set energy_remaining = 0, last_regen_at = now() - interval '24 hours' where user_id = v_user;
  v_out := public._energy_view(v_user);
  perform pg_temp.chk(9, 'TEST 12: 0 de energía y 24 horas → 6, no más', (v_out ->> 'remaining')::int = 6, v_out::text);

  update public.user_energy set energy_remaining = 3, last_regen_at = now() - interval '6 hours' where user_id = v_user;
  v_out := public._energy_view(v_user);
  perform pg_temp.chk(10, 'TEST 12: 3 de energía y 6 horas → 5', (v_out ->> 'remaining')::int = 5, v_out::text);

  -- Y la operación real usa esa misma regeneración: 3 + 6h = 5, gasta 1 → 4.
  v_out := public.complete_lesson(v_user, '__t__', 'l4', 'l3', false, false);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  perform pg_temp.chk(11, 'Completar aplica la regeneración pendiente antes de gastar (3 + 6h = 5, -1 = 4)',
    (v_out ->> 'completed')::boolean and v_energy = 4, 'energía=' || v_energy);

  ---------------------------------------------------------------------------
  -- Atomicidad: si algo falla a mitad, no queda nada a medias.
  -- Se fuerza un fallo al pagar (desbordar el saldo) y se comprueba que la
  -- energía no se ha descontado y la lección no ha quedado completada.
  ---------------------------------------------------------------------------
  perform public.start_lesson(v_user, '__t__', 'l5', 'l4');
  update public.user_tokens set balance = 2147483647 where user_id = v_user;
  select energy_remaining into v_before from public.user_energy where user_id = v_user;
  begin
    perform public.complete_lesson(v_user, '__t__', 'l5', 'l4', false, false);
    v_ok := false; v_detail := 'No falló como se esperaba';
  exception when numeric_value_out_of_range then
    v_ok := true; v_detail := 'falló al pagar, como se forzó';
  end;
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l5';
  perform pg_temp.chk(25, 'Atomicidad: un fallo al pagar no descuenta energía ni completa la lección',
    v_ok and v_energy = v_before and v_row.completed_at is null, v_detail || ' | energía ' || v_before || '→' || v_energy);
  update public.user_tokens set balance = 60 where user_id = v_user;

  ---------------------------------------------------------------------------
  -- TEST 11 · Premium: energía infinita, completar no consume, +15 tokens
  ---------------------------------------------------------------------------
  insert into public.subscriptions (user_id, status, plan) values (v_user, 'active', 'premium_test');
  select energy_remaining into v_before from public.user_energy where user_id = v_user;
  v_out := public.complete_lesson(v_user, '__t__', 'l5', 'l4', false, false);
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  perform pg_temp.chk(26, 'TEST 11: Premium completa sin gastar energía y cobra +15',
    (v_out ->> 'completed')::boolean and (v_out ->> 'spent')::boolean = false and (v_out ->> 'premium')::boolean
    and v_out ->> 'remaining' is null and v_energy = v_before and v_tokens = 75,
    v_out::text);

  -- Con la energía a 0 también: Premium nunca se queda sin energía.
  update public.user_energy set energy_remaining = 0, last_regen_at = now() where user_id = v_user;
  perform public.start_lesson(v_user, '__t__', 'l6', 'l5');
  v_out := public.complete_lesson(v_user, '__t__', 'l6', 'l5', false, false);
  perform pg_temp.chk(27, 'TEST 11: Premium con 0 de energía sigue completando', (v_out ->> 'completed')::boolean, v_out::text);
  delete from public.subscriptions where user_id = v_user;

  ---------------------------------------------------------------------------
  -- Seguridad de la recompensa: una sola vez por lección
  ---------------------------------------------------------------------------
  select count(*) into v_count from public.token_transactions where user_id = v_user and type = 'lesson_completion';
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  perform pg_temp.chk(28, 'Cada lección completada tiene exactamente un movimiento de +15',
    v_count = 6 and v_tokens = 90, v_count || ' movimientos, saldo ' || v_tokens);

  ---------------------------------------------------------------------------
  -- TEST 10 · Llamadas directas desde el navegador
  ---------------------------------------------------------------------------
  -- Una fila lista para completar, para que si la llamada directa funcionara,
  -- ganara algo.
  delete from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l7';
  insert into public.lesson_activations (user_id, course_slug, lesson_slug) values (v_user, '__t__', 'l7');
  update public.user_energy set energy_remaining = 6, last_regen_at = now() where user_id = v_user;

  foreach v_fn in array array[
    'public.complete_lesson(''%1$s'', ''__t__'', ''l7'', null, false, false)',
    'public.start_lesson(''%1$s'', ''__t__'', ''l8'', null)',
    'public.record_quiz_answer(''%1$s'', ''__t__'', ''l7'', ''q1'', true, array[''q1''])',
    'public.save_quiz_state(''%1$s'', ''__t__'', ''l7'', ''{}''::jsonb)',
    'public.reset_quiz_progress(''%1$s'', ''__t__'', ''l7'')',
    'public.record_challenge_pass(''%1$s'', ''__t__'', ''l7'')'
  ] loop
    foreach q in array array['authenticated', 'anon'] loop
      begin
        execute format('set local role %s', q);
        execute format('select %s', format(v_fn, v_user));
        reset role;
        perform pg_temp.chk(29, 'TEST 10: ' || q || ' NO puede llamar directamente a ' || split_part(v_fn, '(', 1), false, 'SE EJECUTÓ');
      exception when insufficient_privilege then
        reset role;
        perform pg_temp.chk(29, 'TEST 10: ' || q || ' NO puede llamar directamente a ' || split_part(v_fn, '(', 1), true, 'permission denied');
      end;
    end loop;
  end loop;

  -- Y tras todos esos intentos, nada ha cambiado.
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l7';
  select energy_remaining into v_energy from public.user_energy where user_id = v_user;
  select balance into v_tokens from public.user_tokens where user_id = v_user;
  perform pg_temp.chk(30, 'TEST 10: tras los intentos directos, ni energía ni tokens ni progreso cambian',
    v_row.completed_at is null and v_energy = 6 and v_tokens = 90, 'energía=' || v_energy || ' tokens=' || v_tokens);

  -- Solo el servidor puede.
  begin
    set local role service_role;
    v_out := public.start_lesson(v_user, '__t__', 'l8', null);
    reset role;
    perform pg_temp.chk(31, 'El servidor (service_role) sí puede ejecutarlas', (v_out ->> 'started')::boolean, v_out::text);
  exception when insufficient_privilege then
    reset role;
    perform pg_temp.chk(31, 'El servidor (service_role) sí puede ejecutarlas', false, 'permission denied para service_role');
  end;

  -- Tampoco se puede escribir el progreso directamente en la tabla.
  foreach v_fn in array array[
    'update public.lesson_activations set completed_at = now() where user_id = ''%1$s''',
    'insert into public.lesson_activations (user_id, course_slug, lesson_slug, completed_at) values (''%1$s'', ''__t__'', ''zzz'', now())',
    'delete from public.lesson_activations where user_id = ''%1$s'''
  ] loop
    begin
      set local role authenticated;
      execute format(v_fn, v_user);
      reset role;
      perform pg_temp.chk(32, 'TEST 10: escritura directa en la tabla de progreso', false, 'SE EJECUTÓ: ' || left(v_fn, 40));
    exception when insufficient_privilege then
      reset role;
      perform pg_temp.chk(32, 'TEST 10: escritura directa en la tabla de progreso denegada', true, left(v_fn, 40));
    end;
  end loop;

  -- Las funciones antiguas, llamables por el usuario, ya no existen.
  select count(*) into v_count from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and ((p.proname = 'complete_lesson' and p.pronargs = 2)
       or p.proname = 'consume_lesson_energy'
       or (p.proname = 'save_quiz_progress'));
  perform pg_temp.chk(33, 'Las RPC antiguas (complete_lesson de 2 args, consume_lesson_energy, save_quiz_progress) no existen',
    v_count = 0, v_count || ' encontradas');

  ---------------------------------------------------------------------------
  -- RLS: solo se lee lo propio
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_other::text)::text, true);
  set local role authenticated;
  select count(*) into v_count from public.lesson_activations where course_slug = '__t__';
  reset role;
  perform pg_temp.chk(34, 'Otro usuario no ve mi progreso (RLS)', v_count = 0, v_count || ' filas visibles');

  perform set_config('request.jwt.claims', json_build_object('sub', v_user::text)::text, true);
  set local role authenticated;
  select count(*) into v_count from public.lesson_activations where course_slug = '__t__';
  reset role;
  perform pg_temp.chk(35, 'Yo sí veo mi propio progreso (RLS)', v_count > 0, v_count || ' filas visibles');

  ---------------------------------------------------------------------------
  -- Validaciones de los datos que llegan
  ---------------------------------------------------------------------------
  begin
    perform public.record_quiz_answer(v_user, '__t__', 'l7', 'zz', true, qs);
    v_ok := false; v_detail := 'Aceptó una pregunta ajena al quiz';
  exception when check_violation then v_ok := true; v_detail := 'rechazada';
  end;
  perform pg_temp.chk(36, 'Una pregunta que no es del quiz se rechaza', v_ok, v_detail);

  begin
    perform public.save_quiz_state(v_user, '__t__', 'l7', '[1,2]'::jsonb);
    v_ok := false; v_detail := 'Aceptó un array';
  exception when check_violation then v_ok := true; v_detail := 'rechazada';
  end;
  perform pg_temp.chk(37, 'Una instantánea que no es un objeto se rechaza', v_ok, v_detail);

  begin
    perform public.save_quiz_state(v_user, '__t__', 'l7', jsonb_build_object('x', repeat('x', 6000)));
    v_ok := false; v_detail := 'Aceptó más de 4 KB';
  exception when check_violation then v_ok := true; v_detail := 'rechazada';
  end;
  perform pg_temp.chk(38, 'Una instantánea de más de 4 KB se rechaza', v_ok, v_detail);

  ---------------------------------------------------------------------------
  -- Continuar el quiz donde se dejó, y reiniciarlo
  ---------------------------------------------------------------------------
  perform public.record_quiz_answer(v_user, '__t__', 'l7', 'q1', true, qs);
  v_out := public.save_quiz_state(v_user, '__t__', 'l7', v_state);
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l7';
  perform pg_temp.chk(39, 'El punto del quiz se guarda y las acertadas quedan registradas',
    (v_out ->> 'saved')::boolean and v_row.quiz_state = v_state and v_row.quiz_solved = array['q1']
    and v_row.quiz_status = 'in_progress' and v_row.completed_at is null,
    v_out::text);

  v_out := public.reset_quiz_progress(v_user, '__t__', 'l7');
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l7';
  perform pg_temp.chk(40, 'Reiniciar deja el quiz sin empezar y sin lo acertado',
    (v_out ->> 'reset')::boolean and v_row.quiz_status = 'not_started' and v_row.quiz_state is null and v_row.quiz_solved = '{}',
    v_out::text);

  -- Reiniciar no destruye avance: ni un quiz superado ni una lección completada.
  v_out := public.reset_quiz_progress(v_user, '__t__', 'l1');
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  perform pg_temp.chk(41, 'Reiniciar no toca una lección completada',
    (v_out ->> 'reset')::boolean = false and v_row.completed_at is not null and v_row.quiz_status = 'completed',
    v_out::text);

  v_out := public.save_quiz_state(v_user, '__t__', 'l1', v_state);
  perform pg_temp.chk(42, 'Guardar el punto de un quiz de una lección completada no la reabre',
    (v_out ->> 'saved')::boolean = false and (v_out ->> 'reason') = 'completed', v_out::text);

  v_out := public.record_quiz_answer(v_user, '__t__', 'l1', 'q1', false, qs);
  select * into v_row from public.lesson_activations where user_id = v_user and course_slug = '__t__' and lesson_slug = 'l1';
  perform pg_temp.chk(43, 'Repasar el quiz de una lección completada no cambia nada',
    (v_out ->> 'recorded')::boolean = false and v_row.quiz_solved = qs and v_row.completed_at is not null, v_out::text);

  ---------------------------------------------------------------------------
  -- Cierre: seguridad de las funciones nuevas
  ---------------------------------------------------------------------------
  select count(*) into v_count
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('start_lesson', 'record_quiz_answer', 'save_quiz_state', 'reset_quiz_progress',
                      'record_challenge_pass', 'complete_lesson', '_energy_view')
    and p.prosecdef
    and exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) cfg where cfg like 'search\_path=%')
    and not has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and not has_function_privilege('anon', p.oid, 'EXECUTE');
  perform pg_temp.chk(44, 'Las 7 funciones nuevas: SECURITY DEFINER, search_path fijo y cerradas al navegador',
    v_count = 7, v_count || ' de 7');
end $$;

select n as "#", caso, resultado, detalle
from progress_test_results
order by n, caso;

-- Nada de lo anterior se guarda.
rollback;
