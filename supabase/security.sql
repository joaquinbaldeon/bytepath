-- ===========================================================================
-- BytePath · endurecimiento y límite de peticiones
--
-- Ejecutar DESPUÉS de schema.sql. Va incluido en setup.sql (npm run db:bundle).
-- Es ADITIVO e idempotente: no borra tablas ni datos.
--
-- Dos cosas:
--
--   1. Repite el endurecimiento que ya está en schema.sql, para los proyectos
--      donde schema.sql se ejecutó ANTES de que existiera:
--        · `profiles` deja de depender solo de RLS (se retiran los permisos por
--          defecto de Supabase; authenticated solo lee su propia fila: el
--          nombre de usuario no se cambia desde el navegador).
--        · `username_available` deja de ser ejecutable desde el navegador.
--
--   2. Crea el límite de peticiones (rate limit) que usa el servidor para las
--      ejecuciones de código (/api/runs), la comprobación de nombres de usuario
--      y la recuperación de contraseña.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Endurecimiento de identidad (idéntico a schema.sql)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
drop policy if exists "perfil propio: actualización" on public.profiles;

revoke execute on function public.username_available(text) from public, anon, authenticated;
grant execute on function public.username_available(text) to service_role;



-- ---------------------------------------------------------------------------
-- 2. Límite de peticiones
--
-- Por qué en la base de datos: el hosting de BytePath no está determinado y
-- Next.js suele desplegarse en funciones serverless con varias instancias. Un
-- contador en memoria viviría en UNA instancia y se reiniciaría con cada
-- arranque en frío: no limitaría nada. Supabase ya es parte del servicio, así
-- que no hace falta ningún proveedor nuevo.
--
-- Qué guarda (lo mínimo):
--   · bucket   qué se limita ('runs:minute', 'runs:day', 'username-check'...)
--   · subject  a quién: el id del usuario; 'ip:' + un identificador derivado de
--              la IP con una clave del servidor (HMAC), solo si el hosting
--              declara una cabecera de IP fiable; o 'global' para un tope común.
--              La IP en claro no se guarda. El identificador derivado NO es una
--              anonimización: quien tenga la clave podría recalcularlo para una
--              IP concreta. Por eso dura poco y no se cruza con nada.
--   · user_id  solo cuando el sujeto es un usuario, para que se borre en
--              cascada con la cuenta
--   · window_start, hits  la ventana actual y cuántas peticiones lleva
--
-- No hay historial: una fila por (bucket, sujeto) que se reutiliza al empezar
-- cada ventana.
--
-- Conservación: una fila pasa a ser borrable cuando su ventana empezó hace más
-- de 2 días (la ventana más larga es de 1 día). Se borra en la SIGUIENTE
-- llamada a cualquier límite, hasta 20 filas por llamada (ver `_rate_limit_hit`).
-- Con uso normal cada llamada crea como mucho una fila y puede borrar hasta 20,
-- así que la tabla no crece sin freno. Si durante un tiempo no llega ninguna
-- petición, las filas caducadas esperan a la siguiente: no hay borrado en un
-- plazo exacto sin un proceso programado (cron), que todavía no existe.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket text not null check (char_length(bucket) between 1 and 40),
  subject text not null check (char_length(subject) between 1 and 80),
  user_id uuid references auth.users (id) on delete cascade,
  window_start timestamptz not null,
  hits integer not null check (hits >= 0),
  primary key (bucket, subject)
);

comment on table public.rate_limits is
  'Contadores de límite de peticiones. Sin historial ni IPs en claro. Solo los escriben funciones del servidor.';

-- Índices, cada uno para una consulta concreta:
--   · la clave primaria (bucket, subject) sirve el INSERT ... ON CONFLICT;
--   · window_start, la limpieza de filas caducadas;
--   · user_id, el borrado en cascada al eliminar una cuenta (sin él, borrar un
--     usuario recorre la tabla entera). Parcial: las filas por IP no lo llevan.
create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);
create index if not exists rate_limits_user_id_idx on public.rate_limits (user_id) where user_id is not null;

alter table public.rate_limits enable row level security;
-- Sin políticas: nadie la lee ni la escribe desde el navegador.
revoke all on table public.rate_limits from anon, authenticated;


-- Núcleo común: consume una petición del cupo de (bucket, sujeto).
--
-- Ventana fija: `p_limit` peticiones cada `p_window_seconds`. Atómico: dos
-- peticiones simultáneas no pueden colarse las dos por el último hueco (la
-- fila se bloquea con el INSERT ... ON CONFLICT DO UPDATE).
--
-- Interna: no la puede ejecutar nadie desde fuera. La usan las dos funciones
-- públicas de abajo, que son las que deciden sujeto y límites.
create or replace function public._rate_limit_hit(
  p_bucket text,
  p_subject text,
  p_user uuid,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval := make_interval(secs => p_window_seconds);
  v_row public.rate_limits;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Límite no válido' using errcode = 'check_violation';
  end if;

  insert into public.rate_limits as r (bucket, subject, user_id, window_start, hits)
  values (p_bucket, p_subject, p_user, now(), 1)
  on conflict (bucket, subject) do update
    set window_start = case when r.window_start + v_window <= now() then now() else r.window_start end,
        hits = case when r.window_start + v_window <= now() then 1 else r.hits + 1 end
  returning * into v_row;

  -- Limpieza acotada en CADA llamada: hasta 20 filas cuya ventana empezó hace
  -- más de 2 días. Usa el índice de window_start y salta las filas que otra
  -- petición tenga bloqueadas, así que no compite con los contadores vivos.
  delete from public.rate_limits r
   where r.ctid = any (array(
     select x.ctid from public.rate_limits x
      where x.window_start < now() - interval '2 days'
      limit 20
      for update skip locked
   ));

  return jsonb_build_object(
    'allowed', v_row.hits <= p_limit,
    'remaining', greatest(p_limit - v_row.hits, 0),
    'retry_after', case when v_row.hits <= p_limit then 0
                        else ceil(extract(epoch from (v_row.window_start + v_window - now())))::int end
  );
end;
$$;

revoke execute on function public._rate_limit_hit(text, text, uuid, integer, integer) from public, anon, authenticated, service_role;


-- Límites que decide el servidor (por IP o globales, sin sesión). Solo la puede
-- ejecutar service_role.
create or replace function public.consume_rate_limit(
  p_bucket text,
  p_subject text,
  p_user uuid,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public._rate_limit_hit(p_bucket, p_subject, p_user, p_limit, p_window_seconds);
$$;

revoke execute on function public.consume_rate_limit(text, text, uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, uuid, integer, integer) to service_role;


-- Cupo de ejecuciones de código del usuario con sesión.
--
-- La ejecuta el propio usuario con su sesión (no hace falta la clave de
-- servicio). No tiene parámetros: el sujeto es `auth.uid()` y los límites
-- están fijos aquí, así que nadie puede consumir el cupo de otro ni pedirse un
-- límite más alto. Lo único que un usuario puede hacer llamándola a mano es
-- gastar su propio cupo.
--
-- 12 ejecuciones por minuto y 300 al día: pensado para estudiar, no para
-- bloquear a quien resuelve un desafío. DECISIÓN DE PRODUCTO: ajustable aquí.
create or replace function public.consume_run_quota()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_out jsonb;
begin
  if v_user is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_signed_in', 'retry_after', 0);
  end if;

  v_out := public._rate_limit_hit('runs:minute', v_user::text, v_user, 12, 60);
  if not (v_out ->> 'allowed')::boolean then
    return v_out;
  end if;

  return public._rate_limit_hit('runs:day', v_user::text, v_user, 300, 86400);
end;
$$;

revoke execute on function public.consume_run_quota() from public, anon;
grant execute on function public.consume_run_quota() to authenticated;


-- ¿Está (bucket, sujeto) ya en su límite en la ventana actual? Solo LEE: no
-- cuenta nada. Sirve para los límites de INTENTOS FALLIDOS (login, contraseña
-- actual): se consulta antes de intentar y solo se suma cuando el intento falla,
-- así que quien entra bien a la primera nunca consume cupo. Solo service_role.
create or replace function public.rate_limit_blocked(
  p_bucket text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rate_limits r
    where r.bucket = p_bucket
      and r.subject = p_subject
      and r.window_start + make_interval(secs => p_window_seconds) > now()
      and r.hits >= p_limit
  );
$$;

revoke execute on function public.rate_limit_blocked(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_blocked(text, text, integer, integer) to service_role;
