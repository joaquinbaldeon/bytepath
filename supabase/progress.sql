-- ===========================================================================
-- BytePath · progreso de lecciones, requisitos y finalización
--
-- Ejecutar completo en el SQL Editor del panel de Supabase, DESPUÉS de
-- schema.sql, energy.sql y economy.sql. Es idempotente.
--
-- No crea tablas: el progreso de una lección vive en la fila que ya existía
-- para cada usuario y lección, `lesson_activations` (energy.sql, sección 3).
-- Aquí están las funciones que la escriben, y lo importante de ellas es QUIÉN
-- puede llamarlas.
--
-- ---------------------------------------------------------------------------
-- El modelo de confianza
--
-- Con la clave publicable en el navegador, cualquier usuario con sesión puede
-- llamar directamente a cualquier función que `authenticated` pueda ejecutar,
-- con los parámetros que quiera, sin pasar por la interfaz ni por el código de
-- la aplicación. Por eso una función de escritura que aceptara "estoy
-- completando la lección X" de parte del usuario no protege nada: nadie
-- comprueba que haya hecho el quiz.
--
-- Todas las funciones de escritura de este archivo llevan el usuario como
-- PARÁMETRO (`p_user`) y solo las puede ejecutar `service_role`, es decir, el
-- servidor de la aplicación con su clave secreta. El navegador no tiene
-- permiso para invocarlas. El servidor es quien corrige el quiz (las
-- respuestas correctas no salen de él), quien recibe el veredicto del juez y
-- quien conoce el orden de las lecciones; y le pasa a la base de datos lo que
-- ha comprobado. La base de datos, a su vez, no se fía del todo: `complete_lesson`
-- vuelve a comprobar dentro de su transacción que la lección anterior está
-- completada, que el quiz y el desafío constan como superados, y que hay
-- energía, y gasta esa energía y paga los tokens sin poder dejar nada a medias.
--
-- Lo que sigue abierto al usuario es solo LECTURA de sus propias filas (RLS).
-- ---------------------------------------------------------------------------
--
-- Qué se guarda de un quiz en curso (`quiz_state`), a propósito lo mínimo:
--   { "v": 1,
--     "order":        ["q1", ...],   -- orden barajado de este intento
--     "currentRound": ["q3", ...],   -- lo que queda por responder en la ronda
--     "nextRound":    ["q2", ...],   -- las falladas, para la ronda siguiente
--     "roundNumber":  1,
--     "roundTotal":   6,
--     "results":      { "q1": { "solved": true, "failed": false }, ... } }
-- Es solo para poder CONTINUAR donde se dejó. Las preguntas acertadas de
-- verdad están en `quiz_solved`, que solo escribe `record_quiz_answer`.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 0. Retirada de las funciones anteriores
--
-- Versiones previas de estas funciones aceptaban llamadas del propio usuario
-- (`authenticated`), y `complete_lesson` daba tokens sin comprobar nada. Se
-- eliminan por completo en vez de dejarlas con otro nombre: mientras existan,
-- cualquiera puede llamarlas directamente.
-- ---------------------------------------------------------------------------
drop function if exists public.consume_lesson_energy(text, text);
drop function if exists public.complete_lesson(text, text);
drop function if exists public.save_quiz_progress(text, text, jsonb, boolean);
drop function if exists public.reset_quiz_progress(text, text);


-- ---------------------------------------------------------------------------
-- 1. Vista de la energía de un usuario (solo lectura, uso interno)
--
-- Lo mismo que calcula get_account_state, pero para un usuario dado y sin
-- necesidad de sesión. Las demás funciones la usan para devolver siempre, junto
-- a su resultado, la energía "de ahora": así el navegador actualiza su medidor
-- con lo que dijo la base de datos y no con una cuenta propia.
-- ---------------------------------------------------------------------------
create or replace function public._energy_view(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row public.user_energy%rowtype;
  v_remaining smallint;
  v_anchor timestamptz;
begin
  if public.is_premium(p_user) then
    return jsonb_build_object('premium', true, 'remaining', null, 'limit', null, 'next_energy_at', null);
  end if;

  select * into v_row from public.user_energy e where e.user_id = p_user;

  if not found then
    return jsonb_build_object('premium', false, 'remaining', 6, 'limit', 6, 'next_energy_at', null);
  end if;

  select r.remaining, r.last_regen_at
    into v_remaining, v_anchor
  from public.compute_energy_regen(v_row.energy_remaining, v_row.last_regen_at) r;

  return jsonb_build_object(
    'premium', false,
    'remaining', v_remaining,
    'limit', 6,
    'next_energy_at', case when v_remaining >= 6 then null else v_anchor + interval '3 hours' end
  );
end;
$$;

revoke execute on function public._energy_view(uuid) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Iniciar una lección (gratis)
--
-- Estudiar no cuesta energía. Iniciar solo crea la fila de progreso, que es lo
-- que hace que la lección figure EN PROGRESO. Es idempotente: iniciar dos veces
-- es iniciarla una.
--
-- `p_prerequisite` es la lección que tiene que estar completada antes (la
-- anterior del curso), o null si es la primera. La base de datos no conoce el
-- orden del curso; lo conoce el servidor y se lo pasa.
-- ---------------------------------------------------------------------------
create or replace function public.start_lesson(
  p_user uuid,
  p_course text,
  p_lesson text,
  p_prerequisite text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_user is null or p_course is null or p_lesson is null then
    raise exception 'Faltan datos para iniciar la lección' using errcode = 'check_violation';
  end if;

  if p_prerequisite is not null and not exists (
    select 1 from public.lesson_activations a
    where a.user_id = p_user and a.course_slug = p_course
      and a.lesson_slug = p_prerequisite and a.completed_at is not null
  ) then
    return jsonb_build_object('started', false, 'reason', 'locked');
  end if;

  insert into public.lesson_activations (user_id, course_slug, lesson_slug)
  values (p_user, p_course, p_lesson)
  on conflict (user_id, course_slug, lesson_slug) do nothing;

  return jsonb_build_object('started', true, 'reason', null);
end;
$$;

revoke execute on function public.start_lesson(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.start_lesson(uuid, text, text, text) to service_role;


-- ---------------------------------------------------------------------------
-- 3. Registrar el resultado de una pregunta del quiz
--
-- El servidor ha corregido la pregunta contra las respuestas reales y aquí solo
-- anota el veredicto. Una pregunta acertada se acumula en `quiz_solved`; una
-- fallada no descuenta nada. Cuando `quiz_solved` cubre TODAS las preguntas del
-- quiz (`p_questions`), el quiz pasa a `completed`.
--
-- Se compara contra la lista de preguntas del quiz actual, no contra un
-- número: si el contenido cambia y una pregunta antigua queda en la lista, no
-- cuenta para nada.
-- ---------------------------------------------------------------------------
create or replace function public.record_quiz_answer(
  p_user uuid,
  p_course text,
  p_lesson text,
  p_question text,
  p_correct boolean,
  p_questions text[]
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_completed_at timestamptz;
  v_status text;
  v_solved text[];
begin
  if p_user is null or p_course is null or p_lesson is null or p_question is null
     or p_correct is null or p_questions is null or cardinality(p_questions) = 0 then
    raise exception 'Faltan datos de la respuesta' using errcode = 'check_violation';
  end if;

  if not (p_question = any (p_questions)) then
    raise exception 'La pregunta no pertenece a este quiz' using errcode = 'check_violation';
  end if;

  select a.completed_at, a.quiz_status, a.quiz_solved
    into v_completed_at, v_status, v_solved
  from public.lesson_activations a
  where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson
  for update;

  if not found then
    return jsonb_build_object('recorded', false, 'reason', 'not_started');
  end if;

  if v_completed_at is not null then
    return jsonb_build_object('recorded', false, 'reason', 'completed', 'quiz_status', v_status);
  end if;

  if p_correct then
    -- Sin duplicados, y solo ids del quiz actual.
    select coalesce(array_agg(distinct s order by s), '{}')
      into v_solved
    from unnest(v_solved || p_question) s
    where s = any (p_questions);
  end if;

  if v_solved @> p_questions then
    v_status := 'completed';
  elsif v_status <> 'completed' then
    v_status := 'in_progress';
  end if;

  update public.lesson_activations a
     set quiz_solved = v_solved,
         quiz_status = v_status,
         quiz_state = case when v_status = 'completed' then null else a.quiz_state end,
         quiz_updated_at = now()
   where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson;

  return jsonb_build_object(
    'recorded', true,
    'quiz_status', v_status,
    'solved', cardinality(v_solved),
    'total', cardinality(p_questions)
  );
end;
$$;

revoke execute on function public.record_quiz_answer(uuid, text, text, text, boolean, text[]) from public, anon, authenticated;
grant execute on function public.record_quiz_answer(uuid, text, text, text, boolean, text[]) to service_role;


-- ---------------------------------------------------------------------------
-- 4. Guardar el punto del quiz (para continuar donde se dejó)
--
-- No es una fuente de verdad de nada: es solo la memoria de en qué pregunta
-- iba el estudiante. Rechaza, sin error, lo que no toca guardar: lección sin
-- iniciar, ya completada, o con el quiz ya superado (un repaso posterior no
-- debe hacerlo retroceder).
-- ---------------------------------------------------------------------------
create or replace function public.save_quiz_state(
  p_user uuid,
  p_course text,
  p_lesson text,
  p_state jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_completed_at timestamptz;
begin
  if p_user is null or p_course is null or p_lesson is null then
    raise exception 'Faltan datos' using errcode = 'check_violation';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'La instantánea del quiz debe ser un objeto' using errcode = 'check_violation';
  end if;
  if pg_column_size(p_state) > 4096 then
    raise exception 'La instantánea del quiz es demasiado grande' using errcode = 'check_violation';
  end if;

  select a.quiz_status, a.completed_at
    into v_status, v_completed_at
  from public.lesson_activations a
  where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson
  for update;

  if not found then
    return jsonb_build_object('saved', false, 'reason', 'not_started');
  end if;
  if v_completed_at is not null then
    return jsonb_build_object('saved', false, 'reason', 'completed');
  end if;
  if v_status = 'completed' then
    return jsonb_build_object('saved', false, 'reason', 'quiz_completed');
  end if;

  update public.lesson_activations a
     set quiz_status = 'in_progress', quiz_state = p_state, quiz_updated_at = now()
   where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson;

  return jsonb_build_object('saved', true);
end;
$$;

revoke execute on function public.save_quiz_state(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_quiz_state(uuid, text, text, jsonb) to service_role;


-- ---------------------------------------------------------------------------
-- 5. Reiniciar un quiz en curso
--
-- Solo vale para un quiz EN CURSO: lo deja sin empezar y borra lo acertado.
-- Nunca toca una lección completada ni un quiz ya superado: reiniciar no puede
-- destruir avance.
-- ---------------------------------------------------------------------------
create or replace function public.reset_quiz_progress(
  p_user uuid,
  p_course text,
  p_lesson text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_rows int;
begin
  if p_user is null or p_course is null or p_lesson is null then
    raise exception 'Faltan datos' using errcode = 'check_violation';
  end if;

  update public.lesson_activations a
     set quiz_status = 'not_started', quiz_state = null, quiz_solved = '{}', quiz_updated_at = now()
   where a.user_id = p_user
     and a.course_slug = p_course
     and a.lesson_slug = p_lesson
     and a.completed_at is null
     and a.quiz_status = 'in_progress';

  get diagnostics v_rows = row_count;

  return jsonb_build_object('reset', v_rows > 0);
end;
$$;

revoke execute on function public.reset_quiz_progress(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reset_quiz_progress(uuid, text, text) to service_role;


-- ---------------------------------------------------------------------------
-- 6. Registrar que el desafío está resuelto
--
-- Lo llama el servidor cuando el juez (Judge0, ejecutado por el propio
-- servidor) da el veredicto "passed". Es lo único que hace constar un desafío
-- como superado: el navegador no puede decir "ya lo resolví".
-- ---------------------------------------------------------------------------
create or replace function public.record_challenge_pass(
  p_user uuid,
  p_course text,
  p_lesson text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_user is null or p_course is null or p_lesson is null then
    raise exception 'Faltan datos' using errcode = 'check_violation';
  end if;

  update public.lesson_activations a
     set challenge_passed_at = coalesce(a.challenge_passed_at, now())
   where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson;

  if not found then
    return jsonb_build_object('recorded', false, 'reason', 'not_started');
  end if;

  return jsonb_build_object('recorded', true);
end;
$$;

revoke execute on function public.record_challenge_pass(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_challenge_pass(uuid, text, text) to service_role;


-- ---------------------------------------------------------------------------
-- 7. Completar una lección
--
-- El único sitio donde se gasta energía, se paga la recompensa y se marca una
-- lección como completada, y las tres cosas ocurren en UNA transacción: o
-- pasan todas o no pasa ninguna. Ni 6 → 5 → 4 por completar dos veces la
-- misma, ni energía negativa, ni tokens sin lección, ni lección sin cobrar.
--
-- Comprueba, en este orden y sin salirse de la transacción:
--
--   1. la lección está iniciada;
--   2. si ya estaba completada, no hace nada y lo dice (idempotencia: es lo que
--      hace inofensivos el doble clic, las dos pestañas y el reintento);
--   3. la lección anterior del curso está completada (progresión lineal);
--   4. el quiz consta como superado (si la lección tiene quiz);
--   5. el desafío consta como superado (si la lección tiene desafío);
--   6. hay energía, salvo en Premium. Sin energía no se rechaza ni se pierde
--      nada: la lección sigue EN PROGRESO y se devuelve cuándo llega la
--      siguiente.
--
-- y solo entonces: descuenta exactamente 1, marca completed_at y reparte los
-- +15 (una sola vez por lección, garantizado por el índice único parcial de
-- token_transactions, no por una comprobación que una carrera pudiera esquivar).
--
-- Los parámetros p_prerequisite / p_needs_quiz / p_needs_challenge los conoce
-- el servidor (el orden del curso y qué lleva cada lección) y se los pasa, y
-- esta función solo la puede ejecutar el servidor.
--
-- Orden de bloqueos: primero la fila de la lección, después user_energy,
-- después user_tokens. `refill_energy_with_tokens` toma user_energy y después
-- user_tokens, en el mismo orden relativo: no hay forma de que se esperen
-- mutuamente.
-- ---------------------------------------------------------------------------
create or replace function public.complete_lesson(
  p_user uuid,
  p_course text,
  p_lesson text,
  p_prerequisite text,
  p_needs_quiz boolean,
  p_needs_challenge boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reward constant integer := 15;
  v_completed_at timestamptz;
  v_quiz_status text;
  v_challenge_at timestamptz;
  v_premium boolean;
  v_remaining smallint;
  v_anchor timestamptz;
  v_row_count int;
  v_balance int;
  v_spent boolean := false;
  v_awarded boolean := false;
begin
  if p_user is null or p_course is null or p_lesson is null
     or p_needs_quiz is null or p_needs_challenge is null then
    raise exception 'Faltan datos para completar la lección' using errcode = 'check_violation';
  end if;

  -- 1. Candado de la fila de la lección.
  select a.completed_at, a.quiz_status, a.challenge_passed_at
    into v_completed_at, v_quiz_status, v_challenge_at
  from public.lesson_activations a
  where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson
  for update;

  -- `found` habla de la consulta anterior: se lee ahora, antes de la siguiente.
  if not found then
    select coalesce(t.balance, 0) into v_balance from public.user_tokens t where t.user_id = p_user;
    return public._energy_view(p_user) || jsonb_build_object(
      'completed', false, 'awarded', false, 'spent', false, 'amount', 0,
      'tokens', coalesce(v_balance, 0), 'reason', 'not_started');
  end if;

  select coalesce(t.balance, 0) into v_balance from public.user_tokens t where t.user_id = p_user;
  v_balance := coalesce(v_balance, 0);

  -- 2. Ya completada: no se hace nada más.
  if v_completed_at is not null then
    return public._energy_view(p_user) || jsonb_build_object(
      'completed', true, 'awarded', false, 'spent', false, 'amount', 0,
      'tokens', v_balance, 'reason', 'already_completed');
  end if;

  -- 3. Progresión lineal.
  if p_prerequisite is not null and not exists (
    select 1 from public.lesson_activations a
    where a.user_id = p_user and a.course_slug = p_course
      and a.lesson_slug = p_prerequisite and a.completed_at is not null
  ) then
    return public._energy_view(p_user) || jsonb_build_object(
      'completed', false, 'awarded', false, 'spent', false, 'amount', 0,
      'tokens', v_balance, 'reason', 'locked');
  end if;

  -- 4 y 5. Requisitos de la lección.
  if p_needs_quiz and v_quiz_status <> 'completed' then
    return public._energy_view(p_user) || jsonb_build_object(
      'completed', false, 'awarded', false, 'spent', false, 'amount', 0,
      'tokens', v_balance, 'reason', 'quiz_pending');
  end if;

  if p_needs_challenge and v_challenge_at is null then
    return public._energy_view(p_user) || jsonb_build_object(
      'completed', false, 'awarded', false, 'spent', false, 'amount', 0,
      'tokens', v_balance, 'reason', 'challenge_pending');
  end if;

  -- 6. Energía.
  v_premium := public.is_premium(p_user);

  if not v_premium then
    insert into public.user_energy (user_id, energy_remaining, last_regen_at)
    values (p_user, 6, now())
    on conflict (user_id) do nothing;

    perform 1 from public.user_energy e where e.user_id = p_user for update;

    select r.remaining, r.last_regen_at
      into v_remaining, v_anchor
    from public.user_energy e,
         lateral public.compute_energy_regen(e.energy_remaining, e.last_regen_at) r
    where e.user_id = p_user;

    if v_remaining <= 0 then
      -- Sin energía: la regeneración pendiente sí se guarda, la lección no se
      -- toca y se queda EN PROGRESO.
      update public.user_energy e
         set energy_remaining = v_remaining, last_regen_at = v_anchor
       where e.user_id = p_user;

      return jsonb_build_object(
        'completed', false, 'awarded', false, 'spent', false, 'amount', 0,
        'tokens', v_balance, 'reason', 'no_energy',
        'premium', false, 'remaining', 0, 'limit', 6,
        'next_energy_at', v_anchor + interval '3 hours');
    end if;

    update public.user_energy e
       set energy_remaining = v_remaining - 1, last_regen_at = v_anchor
     where e.user_id = p_user;

    v_spent := true;
  end if;

  -- Marcar la lección como completada. El estado del quiz en curso ya no
  -- sirve de nada y se borra.
  update public.lesson_activations a
     set completed_at = now(),
         quiz_status = 'completed',
         quiz_state = null,
         quiz_updated_at = now()
   where a.user_id = p_user and a.course_slug = p_course and a.lesson_slug = p_lesson;

  -- Recompensa, una sola vez por lección.
  insert into public.token_transactions (user_id, amount, type, course_slug, lesson_slug)
  values (p_user, v_reward, 'lesson_completion', p_course, p_lesson)
  on conflict (user_id, course_slug, lesson_slug) where type = 'lesson_completion' do nothing;

  get diagnostics v_row_count = row_count;

  if v_row_count > 0 then
    insert into public.user_tokens (user_id, balance)
    values (p_user, v_reward)
    on conflict (user_id) do update set balance = public.user_tokens.balance + v_reward
    returning balance into v_balance;
    v_awarded := true;
  end if;

  return public._energy_view(p_user) || jsonb_build_object(
    'completed', true, 'awarded', v_awarded, 'spent', v_spent,
    'amount', case when v_awarded then v_reward else 0 end,
    'tokens', v_balance, 'reason', null);
end;
$$;

revoke execute on function public.complete_lesson(uuid, text, text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.complete_lesson(uuid, text, text, text, boolean, boolean) to service_role;


-- ===========================================================================
-- Solo estructura y funciones. Sin datos de prueba: las pruebas viven en
-- supabase/progress-tests.sql.
-- ===========================================================================
