-- ===========================================================================
-- BytePath · tokens internos y recarga de energía
--
-- Ejecutar completo en el SQL Editor del panel de Supabase, DESPUÉS de
-- schema.sql y energy.sql. Es idempotente.
--
-- Qué añade este archivo:
--   · una tabla de saldo (`user_tokens`) y un libro de movimientos
--     (`token_transactions`), que es también la garantía de que una lección
--     nunca paga dos veces;
--   · `refill_energy_with_tokens()`, que cambia 50 tokens por energía llena;
--   · una nueva versión de `get_account_state()` (definida en energy.sql) que
--     añade el saldo de tokens a lo que ya devolvía.
--
-- Mismo modelo de seguridad que energy.sql: RLS con solo SELECT propio,
-- ninguna política de escritura, y toda escritura real pasa por una función
-- SECURITY DEFINER con `search_path = ''`.
--
-- Los +15 tokens por completar una lección los reparte `complete_lesson`, en
-- progress.sql, dentro de la misma transacción que gasta la energía y marca la
-- lección; se apoya en las tablas y el índice único que define este archivo.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Saldo de tokens
--
-- Una fila por usuario. Es un resumen, no la fuente de verdad: la fuente de
-- verdad es la suma de `token_transactions`. Guardar el saldo aparte evita
-- recalcular esa suma en cada lectura de `/api/cuenta`; que ambas cosas no
-- puedan discrepar es responsabilidad de las funciones de más abajo, que
-- siempre escriben las dos tablas dentro de la misma transacción.
-- ---------------------------------------------------------------------------
create table if not exists public.user_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.user_tokens is
  'Saldo de tokens. Resumen de token_transactions; ninguna escritura directa: pasa siempre por complete_lesson() (progress.sql) o refill_energy_with_tokens().';

drop trigger if exists user_tokens_touch_updated_at on public.user_tokens;
create trigger user_tokens_touch_updated_at
  before update on public.user_tokens
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 2. Libro de movimientos
--
-- Cada fila es un movimiento ya ocurrido: no se edita ni se borra, solo se
-- inserta. Sirve para auditar ("¿de dónde salieron estos tokens?") y, sobre
-- todo, es la propia garantía de que una lección no puede pagar dos veces:
-- el índice único de abajo lo impide a nivel de base de datos, no con una
-- comprobación de la aplicación que una carrera podría esquivar.
--
-- `course_slug`/`lesson_slug` solo tienen sentido para `lesson_completion`;
-- el CHECK obliga a que vengan juntos con ese tipo y ausentes en cualquier
-- otro, para que la tabla no pueda quedar en un estado a medias.
-- ---------------------------------------------------------------------------
create table if not exists public.token_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null check (type in ('lesson_completion', 'energy_refill')),
  course_slug text,
  lesson_slug text,
  created_at timestamptz not null default now(),

  constraint token_transactions_slugs_match_type check (
    (type = 'lesson_completion' and course_slug is not null and lesson_slug is not null)
    or (type = 'energy_refill' and course_slug is null and lesson_slug is null)
  )
);

comment on table public.token_transactions is
  'Ledger de tokens, solo inserción. El índice único de abajo es lo que impide que una misma lección pague dos veces.';

-- La garantía real de "una vez por lección": ninguna fila de tipo
-- lesson_completion puede repetir (user_id, course_slug, lesson_slug). Es un
-- índice PARCIAL —solo mira las filas de ese tipo— porque energy_refill no
-- lleva curso ni lección y no debe competir por esta unicidad.
create unique index if not exists token_transactions_lesson_completion_uidx
  on public.token_transactions (user_id, course_slug, lesson_slug)
  where type = 'lesson_completion';

-- Para listar el historial de una cuenta ordenado por fecha sin recorrer toda
-- la tabla.
create index if not exists token_transactions_user_created_idx
  on public.token_transactions (user_id, created_at desc);


-- ---------------------------------------------------------------------------
-- 3. Row Level Security y privilegios
--
-- Mismo patrón que user_energy: solo SELECT propio, ninguna política de
-- escritura, y los GRANT de INSERT/UPDATE/DELETE que Supabase concede por
-- defecto se retiran explícitamente como segunda cerradura.
-- ---------------------------------------------------------------------------
alter table public.user_tokens enable row level security;
alter table public.token_transactions enable row level security;

drop policy if exists "tokens propios: lectura" on public.user_tokens;
create policy "tokens propios: lectura"
  on public.user_tokens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "movimientos propios: lectura" on public.token_transactions;
create policy "movimientos propios: lectura"
  on public.token_transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.user_tokens from anon, authenticated;
revoke all on table public.token_transactions from anon, authenticated;

grant select on table public.user_tokens to authenticated;
grant select on table public.token_transactions to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Recargar energía con tokens
--
-- 50 tokens exactos por energía llena (6/6). Todo o nada: si no hay al menos
-- 50, o si ya está a tope, no se toca ni el saldo ni la energía.
--
-- Bloquea SIEMPRE en el mismo orden —primero user_energy, después
-- user_tokens— y es la única función de todo el sistema que toca ambas
-- tablas a la vez; como ninguna otra función bloquea en el orden contrario,
-- no hay forma de que dos funciones distintas se esperen mutuamente
-- (deadlock). Dentro de una tabla, el candado de fila (FOR UPDATE) hace que
-- dos recargas simultáneas del mismo usuario se resuelvan en fila: la segunda
-- lee el saldo ya descontado por la primera.
--
-- Premium no participa: ya tiene energía ilimitada, así que "recargarla" no
-- significa nada. Se rechaza explícitamente en vez de dejar que gaste tokens
-- sin necesidad.
-- ---------------------------------------------------------------------------
create or replace function public.refill_energy_with_tokens()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_cost constant integer := 50;
  v_premium boolean;
  v_remaining smallint;
  v_anchor timestamptz;
  v_balance int;
begin
  if v_user is null then
    return jsonb_build_object(
      'refilled', false, 'reason', 'not_signed_in',
      'tokens', null, 'remaining', null, 'next_energy_at', null
    );
  end if;

  v_premium := public.is_premium(v_user);
  if v_premium then
    return jsonb_build_object(
      'refilled', false, 'reason', 'premium_unlimited',
      'tokens', null, 'remaining', null, 'next_energy_at', null
    );
  end if;

  insert into public.user_energy (user_id, energy_remaining, last_regen_at)
  values (v_user, 6, now())
  on conflict (user_id) do nothing;

  -- Candado 1: la fila de energía. Siempre antes que la de tokens.
  perform 1 from public.user_energy e where e.user_id = v_user for update;

  select r.remaining, r.last_regen_at
    into v_remaining, v_anchor
  from public.user_energy e,
       lateral public.compute_energy_regen(e.energy_remaining, e.last_regen_at) r
  where e.user_id = v_user;

  if v_remaining >= 6 then
    -- Ya está lleno: no tiene sentido gastar tokens. Se persiste la
    -- regeneración pendiente igualmente, para no dejar el ancla vieja.
    update public.user_energy set energy_remaining = v_remaining, last_regen_at = v_anchor
      where user_id = v_user;

    select coalesce(balance, 0) into v_balance from public.user_tokens where user_id = v_user;

    return jsonb_build_object(
      'refilled', false, 'reason', 'energy_full',
      'tokens', coalesce(v_balance, 0), 'remaining', v_remaining, 'next_energy_at', null
    );
  end if;

  insert into public.user_tokens (user_id, balance)
  values (v_user, 0)
  on conflict (user_id) do nothing;

  -- Candado 2: la fila de tokens. Siempre después de la de energía.
  select balance into v_balance from public.user_tokens where user_id = v_user for update;

  if v_balance < v_cost then
    -- No alcanza: tampoco aquí se pierde la regeneración pendiente que ya se
    -- había calculado arriba.
    update public.user_energy set energy_remaining = v_remaining, last_regen_at = v_anchor
      where user_id = v_user;

    return jsonb_build_object(
      'refilled', false, 'reason', 'insufficient_tokens',
      'tokens', v_balance, 'remaining', v_remaining,
      'next_energy_at', case when v_remaining >= 6 then null else v_anchor + interval '3 hours' end
    );
  end if;

  update public.user_tokens set balance = balance - v_cost where user_id = v_user;

  insert into public.token_transactions (user_id, amount, type)
  values (v_user, -v_cost, 'energy_refill');

  update public.user_energy set energy_remaining = 6, last_regen_at = now()
    where user_id = v_user;

  return jsonb_build_object(
    'refilled', true, 'reason', null,
    'tokens', v_balance - v_cost, 'remaining', 6, 'next_energy_at', null
  );
end;
$$;

revoke execute on function public.refill_energy_with_tokens() from public, anon;
grant execute on function public.refill_energy_with_tokens() to authenticated;


-- ---------------------------------------------------------------------------
-- 6. get_account_state(): añadir el saldo de tokens
--
-- energy.sql ya define esta función (sin tokens, siempre en null). Aquí se
-- REDEFINE por completo con CREATE OR REPLACE para que también informe del
-- saldo. No es una segunda función ni un concepto nuevo de "estado de la
-- cuenta": es la misma, actualizada, y el resto del código (la RPC que llama
-- /api/cuenta) no tiene que enterarse de que cambió.
--
-- El cuerpo duplica la parte de energía de la versión de energy.sql a
-- propósito: cada archivo debe poder leerse y entenderse por separado sin
-- saltar al otro para saber qué hace una función con este nombre.
-- ---------------------------------------------------------------------------
create or replace function public.get_account_state(
  p_course text default null,
  p_lesson text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_premium boolean;
  v_activated boolean := null;
  v_row public.user_energy%rowtype;
  v_remaining smallint;
  v_anchor timestamptz;
  v_tokens int;
begin
  if v_user is null then
    return jsonb_build_object(
      'signed_in', false, 'premium', false, 'limit', null, 'remaining', null,
      'next_energy_at', null, 'tokens', null, 'lesson_activated', null
    );
  end if;

  v_premium := public.is_premium(v_user);

  if p_course is not null and p_lesson is not null then
    select exists (
      select 1 from public.lesson_activations a
      where a.user_id = v_user and a.course_slug = p_course and a.lesson_slug = p_lesson
    ) into v_activated;
  end if;

  select coalesce(t.balance, 0) into v_tokens from public.user_tokens t where t.user_id = v_user;
  v_tokens := coalesce(v_tokens, 0);

  if v_premium then
    return jsonb_build_object(
      'signed_in', true, 'premium', true, 'limit', null, 'remaining', null,
      'next_energy_at', null, 'tokens', v_tokens, 'lesson_activated', v_activated
    );
  end if;

  select * into v_row from public.user_energy e where e.user_id = v_user;

  if not found then
    v_remaining := 6;
    v_anchor := null;
  else
    select r.remaining, r.last_regen_at
      into v_remaining, v_anchor
    from public.compute_energy_regen(v_row.energy_remaining, v_row.last_regen_at) r;
  end if;

  return jsonb_build_object(
    'signed_in', true, 'premium', false, 'limit', 6, 'remaining', v_remaining,
    'next_energy_at',
      case
        when v_remaining >= 6 or v_anchor is null then null
        else v_anchor + interval '3 hours'
      end,
    'tokens', v_tokens,
    'lesson_activated', v_activated
  );
end;
$$;

revoke execute on function public.get_account_state(text, text) from public, anon;
grant execute on function public.get_account_state(text, text) to authenticated;


-- ===========================================================================
-- Estructura y funciones. Nada de datos de prueba.
--
-- Sin INSERT de saldos ni de movimientos, sin UUID de usuario, ni siquiera
-- comentado. Las pruebas —incluida la forma de darle tokens a una cuenta de
-- prueba para probar la recarga— viven en supabase/economy-tests.sql.
--
-- Idempotente: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, índices
-- IF NOT EXISTS. Volver a ejecutarlo entero no cambia nada que ya estuviera
-- bien.
-- ===========================================================================
