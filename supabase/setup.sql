-- ===========================================================================
-- BytePath · setup.sql
--
-- GENERADO por `npm run db:bundle` a partir de security.sql, energy.sql,
-- economy.sql, progress.sql, legal.sql y auth-guard.sql. No lo edites a mano: edita esos
-- archivos y vuelve a generarlo.
--
-- Cómo usarlo: pégalo ENTERO en el SQL Editor del proyecto de Supabase que usa
-- BytePath (el de NEXT_PUBLIC_SUPABASE_URL), DESPUÉS de schema.sql, y ejecútalo.
-- Es idempotente y no destruye datos: CREATE ... IF NOT EXISTS, CREATE OR
-- REPLACE y ADD COLUMN IF NOT EXISTS. Si algo falla, no se aplica NADA (el
-- editor ejecuta el texto como una sola transacción).
--
-- Después, ejecuta verify.sql para comprobar que todo quedó como debe.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- >>> security.sql
-- ---------------------------------------------------------------------------

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


-- ---------------------------------------------------------------------------
-- >>> energy.sql
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- BytePath · energía, progreso de lecciones y derechos de la cuenta
--
-- Ejecutar completo en el SQL Editor del panel de Supabase, DESPUÉS de
-- schema.sql. Es idempotente: se puede volver a ejecutar sin romper nada,
-- incluso sobre una base que ya tenía versiones anteriores de este archivo
-- (ver los bloques de migración de las secciones 2 y 3).
--
-- Tres ideas sostienen este archivo:
--
--   1. La identidad sigue siendo auth.users.id. Ninguna tabla de aquí
--      referencia el username.
--
--   2. Nadie puede escribir su propia energía, su propio progreso ni su propia
--      suscripción. Las tres tablas tienen RLS con política de SELECT y
--      NINGUNA de INSERT, UPDATE o DELETE, y los permisos de escritura están
--      retirados. Las únicas vías de escritura son funciones SECURITY DEFINER
--      que solo puede ejecutar el servidor de la aplicación (ver progress.sql).
--
--   3. La energía se regenera por reloj, no por calendario. Ver la sección 2:
--      no hay ya un reinicio diario que borre lo que sobra, sino +1 cada 3
--      horas hasta un máximo de 4. Sigue sin haber cron: el cálculo se hace
--      de forma perezosa, al leer o al escribir, con `compute_energy_regen()`.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 0. El día de BytePath
--
-- Ya no decide cuándo se reinicia la energía —eso ahora es un reloj de 3 en 3
-- horas, no un calendario—, pero sigue haciendo falta para otras cosas: es la
-- fecha que queda anotada en `lesson_activations.activated_on`, informativa
-- para entender el histórico de una cuenta.
--
-- Perú no aplica horario de verano desde 1994, así que America/Lima es
-- UTC-05:00 constante: "hoy en Lima" no tiene ambigüedades.
-- ---------------------------------------------------------------------------
create or replace function public.app_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Lima')::date;
$$;

comment on function public.app_today() is
  'Fecha "de hoy" según America/Lima. Ya no gobierna la energía (ver compute_energy_regen); queda como referencia de calendario para el histórico.';


-- ---------------------------------------------------------------------------
-- 1. Suscripciones
--
-- Es la fuente de verdad de Premium, y está separada de profiles a propósito:
-- profiles tiene una política de UPDATE para el propio usuario (preparada para
-- la edición de perfil), así que un campo is_premium ahí sería escribible por
-- quien quisiera regalárselo. Los derechos de la cuenta no pueden vivir en una
-- tabla que el usuario edita.
--
-- Todavía no hay cobros: las columnas de proveedor existen vacías para que la
-- futura integración solo tenga que rellenarlas, sin migrar nada.
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,

  -- free      · nunca ha pagado, o el ciclo terminó y volvió al plan gratuito
  -- active    · suscripción vigente  → Premium
  -- canceled  · cancelada, puede seguir vigente hasta current_period_end
  -- expired   · terminada sin renovar
  status text not null default 'free'
    check (status in ('free', 'active', 'canceled', 'expired')),

  -- Identificador del plan contratado. Null mientras no haya facturación.
  plan text,

  -- Hasta cuándo dan derecho los pagos recibidos. Null = sin vencimiento.
  current_period_end timestamptz,

  -- Rellenados por el futuro webhook: 'stripe', 'mercadopago', lo que sea.
  provider text,
  provider_customer_id text,
  provider_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Derechos de la cuenta. Solo escribible por el servidor (service role) o por las funciones SECURITY DEFINER. El cliente jamás escribe aquí.';

-- Para el futuro webhook: localizar la fila por el identificador del proveedor
-- sin recorrer la tabla.
create unique index if not exists subscriptions_provider_subscription_key
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;


-- ---------------------------------------------------------------------------
-- 2. Energía
--
-- Una fila por usuario. Guarda cuánta energía había en el último instante
-- conocido (`energy_remaining`) y desde cuándo cuenta esa cifra
-- (`last_regen_at`). El valor "de ahora" nunca se lee directamente de la
-- columna: se recalcula con `compute_energy_regen()`, que aplica +1 por cada
-- bloque de 3 horas transcurridas desde `last_regen_at`, sin superar 4.
--
-- No hay reinicio diario ni nada que borre energía sobrante: lo que no se
-- gasta se queda, hasta el tope de 4. Por eso ya no existe una columna de
-- fecha aquí (la versión anterior de este archivo tenía `energy_date`; la
-- migración de abajo la retira de las instalaciones que ya la tuvieran).
--
-- El CHECK sigue siendo la última línea de defensa de "nunca negativo" y
-- "nunca más de 4": aunque una función futura se equivocase, la base de datos
-- rechaza la escritura.
--
-- El 4 debe decir lo mismo que FREE_MAX_ENERGY en src/lib/energy/config.ts.
-- Las 3 horas deben decir lo mismo que ENERGY_REGEN_HOURS en ese archivo.
--
-- El tope bajó de 6 a 4. La migración de abajo, además de lo de siempre,
-- reduce a 4 la energía de cualquier cuenta que tuviera más (5 o 6) ANTES de
-- endurecer el CHECK: si no se hiciera, el ALTER fallaría en cuanto existiera
-- una sola fila con un valor que la nueva regla ya no admite.
-- ---------------------------------------------------------------------------
create table if not exists public.user_energy (
  user_id uuid primary key references auth.users (id) on delete cascade,
  energy_remaining smallint not null default 4
    check (energy_remaining >= 0 and energy_remaining <= 4),
  last_regen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración para instalaciones que ya ejecutaron la versión anterior de este
-- archivo (energía con reinicio diario por `energy_date`). Añadir una columna
-- NOT NULL con DEFAULT es una operación de metadatos en Postgres moderno, así
-- que es segura incluso con la tabla ya poblada. Ejecutar esto sobre una
-- instalación nueva (que ya nace con `last_regen_at` desde el CREATE TABLE de
-- arriba) no hace nada: ambas líneas son IF NOT EXISTS / IF EXISTS.
alter table public.user_energy add column if not exists last_regen_at timestamptz not null default now();
alter table public.user_energy drop column if exists energy_date;

-- Migración del tope de 6 a 4, para instalaciones que ya tenían la tabla con
-- el CHECK antiguo. Primero se recorta lo que hubiera por encima de 4 (nadie
-- pierde el resto de su cuenta por esto, solo el sobrante de energía por
-- encima del nuevo máximo), y solo entonces se sustituye el CHECK. Sobre una
-- instalación nueva (que ya nace con el CHECK de arriba) el UPDATE no
-- encuentra filas que tocar y el DROP/ADD es CREATE OR REPLACE de facto.
update public.user_energy set energy_remaining = 4 where energy_remaining > 4;
alter table public.user_energy drop constraint if exists user_energy_energy_remaining_check;
alter table public.user_energy
  add constraint user_energy_energy_remaining_check
  check (energy_remaining >= 0 and energy_remaining <= 4);

comment on table public.user_energy is
  'Energía disponible. Se regenera +1 cada 3 horas hasta un máximo de 4; el cálculo real vive en compute_energy_regen(), no en esta tabla directamente.';


-- ---------------------------------------------------------------------------
-- 3. Lecciones iniciadas (y su progreso)
--
-- Una fila por usuario y lección. Nace cuando la lección se INICIA (es
-- gratis: estudiar no cuesta energía) y es la fuente de verdad de en qué
-- punto está:
--
--   · sin fila            → no iniciada
--   · fila, sin completed_at → EN PROGRESO
--   · completed_at        → COMPLETADA (y solo entonces se desbloquea la
--                           siguiente lección del curso)
--
-- Lo que hace falta para completarla lo registra el servidor, nunca el
-- navegador:
--   · quiz_solved          preguntas del quiz que el servidor ha corregido
--                          como acertadas (no lo que diga el cliente)
--   · quiz_status          not_started → in_progress → completed; pasa a
--                          completed cuando quiz_solved cubre todo el quiz
--   · challenge_passed_at  el juez (Judge0, ejecutado por el servidor) dio el
--                          desafío por resuelto
--   · quiz_state           instantánea del quiz en curso para poder
--                          continuarlo: orden, rondas y fallos. No es una
--                          fuente de verdad de nada: se vacía al terminar
--
-- La energía se gasta AL COMPLETAR, dentro de la misma transacción que marca
-- completed_at (ver `complete_lesson` en progress.sql). Que esta fila esté
-- completada es lo que hace idempotente el cobro: una lección se cobra UNA
-- VEZ, y recargar, hacer doble clic, abrir dos pestañas o repetir la petición
-- no puede cobrar otra.
--
-- La clave primaria compuesta es además la red de seguridad contra dos
-- peticiones simultáneas para la misma lección.
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_activations (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  lesson_slug text not null,
  activated_at timestamptz not null default now(),
  -- Qué día se pagó. Informativo: sirve para entender el gasto, no para el
  -- cálculo, que siempre mira user_energy / compute_energy_regen().
  activated_on date not null default public.app_today(),

  quiz_status text not null default 'not_started'
    check (quiz_status in ('not_started', 'in_progress', 'completed')),
  quiz_state jsonb,
  quiz_updated_at timestamptz,
  quiz_solved text[] not null default '{}',
  challenge_passed_at timestamptz,
  completed_at timestamptz,

  primary key (user_id, course_slug, lesson_slug)
);

-- Migración para instalaciones que ya tenían la tabla solo con la activación.
-- ADD COLUMN IF NOT EXISTS es idempotente; en una instalación nueva no hace
-- nada, porque las columnas ya nacen en el CREATE TABLE de arriba.
alter table public.lesson_activations
  add column if not exists quiz_status text not null default 'not_started'
    check (quiz_status in ('not_started', 'in_progress', 'completed'));
alter table public.lesson_activations add column if not exists quiz_state jsonb;
alter table public.lesson_activations add column if not exists quiz_updated_at timestamptz;
alter table public.lesson_activations add column if not exists quiz_solved text[] not null default '{}';
alter table public.lesson_activations add column if not exists challenge_passed_at timestamptz;
alter table public.lesson_activations add column if not exists completed_at timestamptz;

-- Tope de tamaño de la instantánea: un quiz son seis preguntas, esto son unos
-- cientos de bytes. Que nadie pueda usar la columna como almacén libre.
alter table public.lesson_activations drop constraint if exists lesson_activations_quiz_state_size;
alter table public.lesson_activations
  add constraint lesson_activations_quiz_state_size
  check (quiz_state is null or pg_column_size(quiz_state) <= 4096);

comment on table public.lesson_activations is
  'Progreso de una lección por usuario: iniciada (fila), requisitos cumplidos según el servidor (quiz_solved, challenge_passed_at) y finalización (completed_at). Solo la escribe el servidor.';


-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--
-- Mismo criterio que profiles: nadie ve lo de otro, nadie escribe nada.
-- Ni una sola política con USING (true).
--
-- Que no haya políticas de INSERT/UPDATE/DELETE es deliberado y es el núcleo
-- de la seguridad de este sistema: con la clave publicable en el navegador,
-- un usuario puede intentar `update user_energy set energy_remaining = 4`
-- todas las veces que quiera y RLS lo rechazará siempre, porque no existe
-- ninguna política que lo permita.
-- ---------------------------------------------------------------------------
alter table public.subscriptions enable row level security;
alter table public.user_energy enable row level security;
alter table public.lesson_activations enable row level security;

drop policy if exists "suscripción propia: lectura" on public.subscriptions;
create policy "suscripción propia: lectura"
  on public.subscriptions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "energía propia: lectura" on public.user_energy;
create policy "energía propia: lectura"
  on public.user_energy
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "activaciones propias: lectura" on public.lesson_activations;
create policy "activaciones propias: lectura"
  on public.lesson_activations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------------
-- 4b. Privilegios de tabla: la segunda cerradura
--
-- RLS y los GRANT son dos cosas distintas, y Supabase concede por defecto
-- INSERT/UPDATE/DELETE sobre las tablas de `public` a los roles anon y
-- authenticated. Hoy eso no basta para escribir, porque no existe ninguna
-- política que lo permita y RLS deniega lo que no autoriza expresamente.
--
-- Pero es una cerradura sola. Si alguien desactivase RLS en una de estas
-- tablas, o añadiese una política permisiva sin pensarlo, el permiso ya
-- estaría concedido esperando debajo. Retirándolo hacen falta dos errores
-- seguidos, no uno, para que el navegador pueda tocar su energía.
--
-- anon pierde también el SELECT: sin sesión no hay ninguna fila que le
-- corresponda, así que ese permiso no sirve para nada legítimo.
-- ---------------------------------------------------------------------------
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.user_energy from anon, authenticated;
revoke all on table public.lesson_activations from anon, authenticated;

grant select on table public.subscriptions to authenticated;
grant select on table public.user_energy to authenticated;
grant select on table public.lesson_activations to authenticated;

-- Qué NO se hace aquí, y por qué: nada de FORCE ROW LEVEL SECURITY. RLS no se
-- aplica al dueño de la tabla, y las funciones de más abajo son SECURITY
-- DEFINER, o sea que se ejecutan justamente como ese dueño. Forzarlo dejaría
-- sin escribir a lo único que tiene permiso para escribir, y la energía no se
-- podría descontar.


-- ---------------------------------------------------------------------------
-- 5. updated_at automático
-- ---------------------------------------------------------------------------
drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

drop trigger if exists user_energy_touch_updated_at on public.user_energy;
create trigger user_energy_touch_updated_at
  before update on public.user_energy
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 6. ¿Es Premium?
--
-- La respuesta a esa pregunta vive AQUÍ, en una sola función, y en ningún otro
-- sitio. Ni una comparación de correos, ni una lista de usuarios, ni una
-- bandera en el cliente.
--
-- 'canceled' sigue dando Premium mientras no venza el periodo pagado: quien
-- cancela a mitad de mes no pierde lo que ya pagó. Esa regla es de negocio y
-- por eso está en la base de datos, no repartida por la aplicación.
--
-- El día que haya cobros, lo único que cambia es quién escribe en
-- subscriptions. Esta función no se toca.
-- ---------------------------------------------------------------------------
create or replace function public.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user
      and s.status in ('active', 'canceled')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

revoke execute on function public.is_premium(uuid) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 7. Regeneración de energía: la función pura
--
-- Dado "cuánta energía había" y "desde cuándo cuenta esa cifra", devuelve
-- cuánta hay AHORA MISMO y desde cuándo cuenta la cifra nueva. No lee ni
-- escribe ninguna tabla: es una función de sus argumentos y de `now()`, así
-- que es segura de llamar tanto para pintar (sin persistir nada) como para
-- escribir (persistiendo lo que devuelve).
--
-- Un "tick" son 3 horas exactas. Se cuentan con floor(), nunca se redondea
-- hacia arriba: a las 2h59m del último tick todavía no ha llegado el
-- siguiente. Al llegar a 4 se considera lleno y el ancla se reinicia a
-- `now()` — no porque haga falta para el cálculo (es puramente funcional, no
-- hay deriva posible releyendo el mismo ancla antigua una y otra vez), sino
-- para que la cuenta atrás que ve el estudiante, la próxima vez que gaste
-- energía por debajo de 4, empiece a contar desde el momento real en que dejó
-- de estar lleno y no desde un ancla arbitrariamente vieja.
--
-- Ejemplo (con ancla a las 08:00 y 1/4):
--   11:00 → 1 tick  → 2/4, ancla 11:00
--   14:00 → 1 tick  → 3/4, ancla 14:00
--   17:00 → 1 tick  → 4/4, ancla 17:00 (lleno: se fija a "ahora")
-- ---------------------------------------------------------------------------
create or replace function public.compute_energy_regen(
  p_remaining smallint,
  p_last_regen_at timestamptz
)
returns table (remaining smallint, last_regen_at timestamptz)
language sql
stable
set search_path = ''
as $$
  with ticks as (
    select greatest(
      0,
      floor(extract(epoch from (now() - p_last_regen_at)) / (3 * 3600))
    )::int as n
  )
  select
    least(4, p_remaining + ticks.n)::smallint,
    case
      when p_remaining + ticks.n >= 4 then now()
      when ticks.n > 0 then p_last_regen_at + (ticks.n * interval '3 hours')
      else p_last_regen_at
    end
  from ticks;
$$;

revoke execute on function public.compute_energy_regen(smallint, timestamptz) from public, anon, authenticated;

comment on function public.compute_energy_regen(smallint, timestamptz) is
  'Función pura: dado un saldo y su ancla temporal, devuelve el saldo "de ahora" y la nueva ancla. No toca ninguna tabla.';


-- ---------------------------------------------------------------------------
-- 8. Estado de la cuenta (solo lectura)
--
-- Lo que necesita la interfaz para pintarse: si eres Premium, cuánta energía
-- tienes ahora mismo, cuándo llega la próxima y si esta lección concreta ya
-- está pagada.
--
-- No escribe nada. Leer una página nunca debe modificar la energía:
-- `compute_energy_regen()` se llama en modo lectura, sobre lo que hay
-- guardado, sin persistir el resultado. El descuento real ocurre en
-- `consume_lesson_energy`, y ambos usan la misma función pura, así que la
-- cifra que se pinta y la que se descuenta no pueden discrepar.
--
-- Devuelve jsonb porque el conjunto de campos crecerá. El campo `tokens` va
-- fijo a null aquí: esta es la versión de energy.sql, que no sabe nada de
-- tokens. economy.sql redefine esta misma función (CREATE OR REPLACE) para
-- añadir el saldo real; si economy.sql todavía no se ha ejecutado, la
-- aplicación sigue funcionando con `tokens: null` sin caerse.
--
--   { "signed_in": bool,
--     "premium":   bool,
--     "limit":     int|null,       -- null = ilimitada
--     "remaining": int|null,       -- null = ilimitada
--     "next_energy_at": ts|null,   -- null = a tope o sin límite
--     "tokens":    int|null,
--     "lesson_activated": bool|null }   -- null si no se preguntó
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

  if v_premium then
    return jsonb_build_object(
      'signed_in', true, 'premium', true, 'limit', null, 'remaining', null,
      'next_energy_at', null, 'tokens', null, 'lesson_activated', v_activated
    );
  end if;

  select * into v_row from public.user_energy e where e.user_id = v_user;

  if not found then
    -- Sin fila todavía: nunca ha gastado nada, tiene el cupo entero.
    v_remaining := 4;
    v_anchor := null;
  else
    select r.remaining, r.last_regen_at
      into v_remaining, v_anchor
    from public.compute_energy_regen(v_row.energy_remaining, v_row.last_regen_at) r;
  end if;

  return jsonb_build_object(
    'signed_in', true, 'premium', false, 'limit', 4, 'remaining', v_remaining,
    'next_energy_at',
      case
        when v_remaining >= 4 or v_anchor is null then null
        else v_anchor + interval '3 hours'
      end,
    'tokens', null,
    'lesson_activated', v_activated
  );
end;
$$;

revoke execute on function public.get_account_state(text, text) from public, anon;
grant execute on function public.get_account_state(text, text) to authenticated;


-- ===========================================================================
-- Este archivo define estructura y nada más.
--
-- Aquí NO hay ninguna función que gaste energía. La energía se gasta al
-- COMPLETAR una lección, y esa operación vive en progress.sql
-- (`complete_lesson`), porque solo puede decidirse junto con el progreso de
-- la lección y sus requisitos, en la misma transacción.
--
-- No crea, concede ni modifica ninguna cuenta: no hay INSERT de datos, ni
-- UUID de usuario, ni suscripción de ejemplo, ni siquiera comentada. Un
-- INSERT pegable dentro del esquema de producción es exactamente lo que
-- acaba descomentándose por error un día con prisa.
--
-- Conceder Premium a mano —mientras no haya cobros— es una operación de
-- pruebas y vive con las pruebas, en supabase/energy-tests.sql.
--
-- Ejecutar este archivo dos veces seguidas deja la base igual que ejecutarlo
-- una: todo es CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF
-- EXISTS seguido de CREATE, o ALTER ... IF (NOT) EXISTS.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- >>> economy.sql
-- ---------------------------------------------------------------------------

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
--   · `refill_energy_with_tokens()`, que cambia 100 tokens por energía llena;
--   · una nueva versión de `get_account_state()` (definida en energy.sql) que
--     añade el saldo de tokens a lo que ya devolvía.
--
-- Mismo modelo de seguridad que energy.sql: RLS con solo SELECT propio,
-- ninguna política de escritura, y toda escritura real pasa por una función
-- SECURITY DEFINER con `search_path = ''`.
--
-- Los +10 tokens por completar una lección los reparte `complete_lesson`, en
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
-- 100 tokens exactos por energía llena (4/4). Todo o nada: si no hay al menos
-- 100, o si ya está a tope, no se toca ni el saldo ni la energía.
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
  v_cost constant integer := 100;
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
  values (v_user, 4, now())
  on conflict (user_id) do nothing;

  -- Candado 1: la fila de energía. Siempre antes que la de tokens.
  perform 1 from public.user_energy e where e.user_id = v_user for update;

  select r.remaining, r.last_regen_at
    into v_remaining, v_anchor
  from public.user_energy e,
       lateral public.compute_energy_regen(e.energy_remaining, e.last_regen_at) r
  where e.user_id = v_user;

  if v_remaining >= 4 then
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
      'next_energy_at', case when v_remaining >= 4 then null else v_anchor + interval '3 hours' end
    );
  end if;

  update public.user_tokens set balance = balance - v_cost where user_id = v_user;

  insert into public.token_transactions (user_id, amount, type)
  values (v_user, -v_cost, 'energy_refill');

  update public.user_energy set energy_remaining = 4, last_regen_at = now()
    where user_id = v_user;

  return jsonb_build_object(
    'refilled', true, 'reason', null,
    'tokens', v_balance - v_cost, 'remaining', 4, 'next_energy_at', null
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
    v_remaining := 4;
    v_anchor := null;
  else
    select r.remaining, r.last_regen_at
      into v_remaining, v_anchor
    from public.compute_energy_regen(v_row.energy_remaining, v_row.last_regen_at) r;
  end if;

  return jsonb_build_object(
    'signed_in', true, 'premium', false, 'limit', 4, 'remaining', v_remaining,
    'next_energy_at',
      case
        when v_remaining >= 4 or v_anchor is null then null
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


-- ---------------------------------------------------------------------------
-- >>> progress.sql
-- ---------------------------------------------------------------------------

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
    return jsonb_build_object('premium', false, 'remaining', 4, 'limit', 4, 'next_energy_at', null);
  end if;

  select r.remaining, r.last_regen_at
    into v_remaining, v_anchor
  from public.compute_energy_regen(v_row.energy_remaining, v_row.last_regen_at) r;

  return jsonb_build_object(
    'premium', false,
    'remaining', v_remaining,
    'limit', 4,
    'next_energy_at', case when v_remaining >= 4 then null else v_anchor + interval '3 hours' end
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
-- pasan todas o no pasa ninguna. Ni 4 → 3 → 2 por completar dos veces la
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
-- +10 (una sola vez por lección, garantizado por el índice único parcial de
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
  v_reward constant integer := 10;
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
    values (p_user, 4, now())
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
        'premium', false, 'remaining', 0, 'limit', 4,
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


-- ---------------------------------------------------------------------------
-- >>> legal.sql
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- BytePath · aceptación de documentos legales
--
-- Ejecutar completo en el SQL Editor de Supabase, DESPUÉS de schema.sql. Va
-- incluido al final de setup.sql (npm run db:bundle).
--
-- Es ADITIVO e idempotente: crea tablas, funciones y un trigger nuevos. No
-- modifica ni borra ninguna tabla existente, ni profiles, ni el trigger
-- `handle_new_user`, ni ninguna cuenta.
--
-- Qué guarda y qué no:
--   · usuario, tipo de documento, versión y fecha/hora de aceptación. Nada más.
--   · NO guarda IP, user-agent, dispositivo ni ningún otro dato "por si acaso".
--
-- COMPATIBLE CON CÓDIGO ANTIGUO. Aplicar este archivo NO rompe los registros de
-- una versión de la aplicación que todavía no envía `terms_version`: mientras
-- `legal_config.require_terms_on_signup` sea falso (valor inicial), el trigger
-- registra la aceptación cuando llega y deja pasar el alta cuando no llega.
-- Exigirla es un paso aparte, DESPUÉS de desplegar el código que la envía:
-- supabase/migrations/0002_require_terms_on_signup.sql. Ver docs/security-privacy.md §7.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Versiones de cada documento
--
-- La lista cerrada de versiones. Una aceptación solo es válida si apunta a una
-- fila de aquí (clave foránea).
--
-- `published_at` es la fecha desde la que esa versión rige. Con ella basta
-- para distinguir "publicada" de "vigente", sin campos nuevos:
--   · una versión con fecha futura existe, pero todavía no se puede aceptar;
--   · la VIGENTE es la más reciente con fecha de hoy o anterior (hora de Lima).
--   · las anteriores a la vigente ya no se pueden aceptar; las aceptaciones que
--     ya existían de ellas se conservan tal cual.
--
-- Publicar una versión nueva de los Términos:
--   insert into public.legal_documents (document_type, version, published_at)
--   values ('terms', '1.1', 'AAAA-MM-DD');
-- y desplegar el código con TERMS_VERSION = '1.1' (src/lib/legal/documents.ts)
-- a partir de esa fecha. Si el código envía una versión que no es la vigente, el
-- alta no registra aceptación (o se rechaza, si ya se exige): ver §4.
-- ---------------------------------------------------------------------------
create table if not exists public.legal_documents (
  document_type text not null check (document_type in ('terms', 'privacy')),
  version text not null check (version ~ '^[0-9]+(\.[0-9]+)*$'),
  published_at date not null,
  primary key (document_type, version)
);

comment on table public.legal_documents is
  'Versiones de los documentos legales. Rige la más reciente con published_at <= hoy.';

insert into public.legal_documents (document_type, version, published_at)
values ('terms', '1.0', '2026-09-26')
on conflict (document_type, version) do nothing;


-- ---------------------------------------------------------------------------
-- 2. Aceptaciones
--
-- Una fila por usuario, documento y versión: aceptar la 1.0 y más adelante la
-- 1.1 son dos filas, y queda claro qué aceptó cada uno y cuándo.
--
-- `on delete cascade`: si se elimina la cuenta, se eliminan sus aceptaciones
-- (minimización). Si se decidiera conservarlas como prueba tras la baja, es
-- una decisión que debe tomar el responsable con asesoramiento.
-- ---------------------------------------------------------------------------
create table if not exists public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),

  constraint legal_acceptances_document_fkey
    foreign key (document_type, document_version)
    references public.legal_documents (document_type, version),
  constraint legal_acceptances_once
    unique (user_id, document_type, document_version)
);

comment on table public.legal_acceptances is
  'Qué versión de cada documento legal aceptó cada usuario, y cuándo. Solo la escriben funciones del servidor.';


-- ---------------------------------------------------------------------------
-- 3. Configuración: ¿se exige la aceptación en el alta?
--
-- Una sola fila. Empieza en FALSO para que aplicar este archivo sea compatible
-- con código que todavía no envía `terms_version`. Volver a ejecutar este
-- archivo NO la cambia (ON CONFLICT DO NOTHING): la pone a verdadero la
-- migración 0002, y solo esa.
-- ---------------------------------------------------------------------------
create table if not exists public.legal_config (
  id boolean primary key default true check (id),
  require_terms_on_signup boolean not null default false
);

insert into public.legal_config (id, require_terms_on_signup)
values (true, false)
on conflict (id) do nothing;

comment on table public.legal_config is
  'Ajustes del registro de aceptaciones. require_terms_on_signup lo activa supabase/migrations/0002.';


-- ---------------------------------------------------------------------------
-- 4. Seguridad
--
-- Mismo criterio que el resto de tablas de BytePath: el usuario puede LEER sus
-- propias aceptaciones; nadie puede escribirlas desde el navegador. Las únicas
-- vías de escritura son funciones SECURITY DEFINER.
-- ---------------------------------------------------------------------------
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.legal_config enable row level security;

drop policy if exists "aceptaciones propias: lectura" on public.legal_acceptances;
create policy "aceptaciones propias: lectura"
  on public.legal_acceptances
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.legal_documents from anon, authenticated;
revoke all on table public.legal_acceptances from anon, authenticated;
revoke all on table public.legal_config from anon, authenticated;
grant select on table public.legal_acceptances to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Versión vigente de un documento
--
-- La más reciente con published_at <= hoy (Lima). Empate de fecha: la de número
-- más alto (1.10 > 1.9). `null` si no hay ninguna vigente todavía. Interna.
-- ---------------------------------------------------------------------------
create or replace function public.current_legal_version(p_type text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.version
  from public.legal_documents d
  where d.document_type = p_type
    and d.published_at <= (now() at time zone 'America/Lima')::date
  order by d.published_at desc, string_to_array(d.version, '.')::int[] desc
  limit 1;
$$;

revoke execute on function public.current_legal_version(text) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 6. Registrar la aceptación al crear la cuenta
--
-- El formulario de registro envía `terms_version` en los metadatos del alta
-- (igual que el username). Este trigger corre en la MISMA transacción que crea
-- el usuario en auth.users:
--
--   · Si la versión enviada es la VIGENTE → registra la aceptación.
--   · Si falta o no es la vigente:
--       - con la exigencia desactivada (transición) → el alta sigue, sin
--         aceptación registrada;
--       - con la exigencia activada → error y Supabase deshace el alta entera.
--
-- El mensaje de error es fijo: no repite el valor recibido.
--
-- Es un trigger aparte de `handle_new_user` a propósito: así este archivo no
-- toca schema.sql y se puede aplicar (o retirar) por separado.
-- ---------------------------------------------------------------------------
create or replace function public.record_signup_terms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version text := nullif(trim(new.raw_user_meta_data ->> 'terms_version'), '');
  v_required boolean;
begin
  if v_version is not null and v_version = public.current_legal_version('terms') then
    insert into public.legal_acceptances (user_id, document_type, document_version)
    values (new.id, 'terms', v_version)
    on conflict (user_id, document_type, document_version) do nothing;
    return new;
  end if;

  select c.require_terms_on_signup into v_required from public.legal_config c where c.id;

  if coalesce(v_required, false) then
    raise exception 'No consta la aceptación de la versión vigente de los Términos'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.record_signup_terms() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_terms on auth.users;
create trigger on_auth_user_created_terms
  after insert on auth.users
  for each row execute function public.record_signup_terms();


-- ---------------------------------------------------------------------------
-- 7. Aceptar la versión vigente con la cuenta ya creada
--
-- Para las cuentas que existían antes de los Términos, o cuando rija una
-- versión nueva. La ejecuta el propio usuario con su sesión:
--
--   · El usuario sale de `auth.uid()`: NO hay parámetro de usuario, así que
--     nadie puede registrar una aceptación en nombre de otra cuenta.
--   · Solo acepta la versión VIGENTE: ni futuras ni anteriores.
--   · Solo INSERTA: una aceptación existente no se modifica (ni la fecha). Repetir
--     la llamada no hace nada.
-- ---------------------------------------------------------------------------
create or replace function public.accept_legal_document(p_type text, p_version text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_row public.legal_acceptances;
begin
  if v_user is null then
    return jsonb_build_object('accepted', false, 'reason', 'not_signed_in');
  end if;

  if p_version is null or p_version is distinct from public.current_legal_version(p_type) then
    return jsonb_build_object('accepted', false, 'reason', 'not_current_version');
  end if;

  insert into public.legal_acceptances (user_id, document_type, document_version)
  values (v_user, p_type, p_version)
  on conflict (user_id, document_type, document_version) do nothing;

  select * into v_row from public.legal_acceptances a
   where a.user_id = v_user and a.document_type = p_type and a.document_version = p_version;

  return jsonb_build_object('accepted', true, 'accepted_at', v_row.accepted_at);
end;
$$;

revoke execute on function public.accept_legal_document(text, text) from public, anon;
grant execute on function public.accept_legal_document(text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- >>> auth-guard.sql
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- BytePath · cuentas y credenciales solo a través del servidor de BytePath
--
-- Va incluido en setup.sql (npm run db:bundle). Es ADITIVO e idempotente: no
-- borra tablas ni datos. Con la EXIGENCIA DESACTIVADA (valor por defecto), no
-- cambia nada para el código que ya está desplegado; la activa la migración
-- migrations/0004_enforce_server_side_auth.sql, DESPUÉS de desplegar el código
-- que envía la prueba de alta y los permisos de cambio de contraseña.
--
-- Por qué. La clave publicable de Supabase está (y debe estar) en el navegador,
-- así que cualquiera puede llamar directamente a la API de Supabase Auth:
--
--   · crear una cuenta con /auth/v1/signup (o con OTP, que crea usuarios)
--     sin pasar por el formulario de BytePath, que exige confirmar 14 años o
--     más y aceptar los Términos;
--   · con una sesión robada, cambiar la contraseña con PUT /auth/v1/user sin
--     la contraseña actual, o pedir un cambio de correo.
--
-- Las reglas de BytePath viven en su servidor, así que la base de datos exige
-- una prueba de que la operación pasó por él:
--
--   1. ALTA. `issue_signup_proof(email)` (solo service_role) devuelve una firma
--      HMAC-SHA256 del correo y la hora, con un secreto que se genera AQUÍ y no
--      sale nunca de la base de datos. El servidor la pide DESPUÉS de validar
--      el formulario y la envía en los metadatos del alta. Un trigger BEFORE
--      INSERT en auth.users la comprueba (correo, firma, 15 minutos de
--      validez) y la BORRA de los metadatos: no queda guardada. No es una
--      marca de edad ni de nada: solo dice «esta alta la hizo el servidor».
--
--   2. CONTRASEÑA. `issue_password_change_ticket(usuario)` (solo service_role)
--      deja un permiso de 2 minutos que el servidor pide DESPUÉS de comprobar
--      la contraseña actual (o el enlace de recuperación reciente). Un trigger
--      BEFORE UPDATE solo deja cambiar `encrypted_password` si hay permiso, y
--      lo consume.
--
--   3. CORREO. BytePath no ofrece cambiar el correo: cualquier cambio de
--      `email` o solicitud de cambio (`email_change`) se rechaza.
--
-- Efecto secundario conocido: con la exigencia activada, crear usuarios o
-- cambiarles la contraseña o el correo desde el panel de Supabase también se
-- rechaza (el trigger no distingue quién llama). Para una operación manual de
-- administración, desactívala un momento:
--   update public.auth_guard_config set enforce = false where id;
--   ... operación ...
--   update public.auth_guard_config set enforce = true where id;
-- ===========================================================================

-- En Supabase, pgcrypto ya está instalada en el esquema `extensions`.
create extension if not exists pgcrypto with schema extensions;


-- ---------------------------------------------------------------------------
-- Tablas internas (nadie las lee desde el navegador)
-- ---------------------------------------------------------------------------
create table if not exists public.server_secrets (
  name text primary key,
  secret bytea not null,
  created_at timestamptz not null default now()
);
comment on table public.server_secrets is
  'Secretos generados por la propia base de datos. Sin acceso desde la API.';

-- Se genera una sola vez; volver a ejecutar setup.sql no lo cambia.
insert into public.server_secrets (name, secret)
values ('signup_proof', extensions.gen_random_bytes(32))
on conflict (name) do nothing;

create table if not exists public.auth_guard_config (
  id boolean primary key default true check (id),
  enforce boolean not null default false
);
comment on table public.auth_guard_config is
  'enforce = true: altas y cambios de credenciales solo a través del servidor de BytePath.';
insert into public.auth_guard_config (id) values (true) on conflict (id) do nothing;

create table if not exists public.credential_change_tickets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expires_at timestamptz not null
);
comment on table public.credential_change_tickets is
  'Permiso de un solo uso y 2 minutos para cambiar la contraseña, emitido por el servidor.';

alter table public.server_secrets enable row level security;
alter table public.auth_guard_config enable row level security;
alter table public.credential_change_tickets enable row level security;
revoke all on table public.server_secrets from anon, authenticated;
revoke all on table public.auth_guard_config from anon, authenticated;
revoke all on table public.credential_change_tickets from anon, authenticated;


-- ---------------------------------------------------------------------------
-- 1. Prueba de alta
-- ---------------------------------------------------------------------------
create or replace function public._signup_proof_mac(p_email text, p_issued bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(convert_to(lower(trim(p_email)) || '|' || p_issued::text, 'UTF8'), s.secret, 'sha256'),
    'hex'
  )
  from public.server_secrets s
  where s.name = 'signup_proof';
$$;

create or replace function public.issue_signup_proof(p_email text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_issued bigint := floor(extract(epoch from now()))::bigint;
begin
  if p_email is null or position('@' in p_email) = 0 then
    return null;
  end if;
  return v_issued::text || '.' || public._signup_proof_mac(p_email, v_issued);
end;
$$;

create or replace function public._signup_proof_valid(p_email text, p_proof text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_issued bigint;
  v_now bigint := floor(extract(epoch from now()))::bigint;
begin
  if p_email is null or p_proof is null or p_proof !~ '^[0-9]{1,12}\.[0-9a-f]{64}$' then
    return false;
  end if;
  v_issued := split_part(p_proof, '.', 1)::bigint;
  -- 15 minutos de validez, y nada emitido "en el futuro".
  if v_issued > v_now + 60 or v_issued < v_now - 900 then
    return false;
  end if;
  return split_part(p_proof, '.', 2) = public._signup_proof_mac(p_email, v_issued);
end;
$$;

create or replace function public.guard_auth_user_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_valid boolean := public._signup_proof_valid(new.email, new.raw_user_meta_data ->> 'signup_proof');
begin
  -- La prueba no se guarda nunca, sea válida o no.
  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb) - 'signup_proof';

  if not v_valid and (select c.enforce from public.auth_guard_config c where c.id) then
    raise exception 'Las cuentas de BytePath solo se crean desde su formulario de registro'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_auth_user_insert on auth.users;
create trigger guard_auth_user_insert
  before insert on auth.users
  for each row execute function public.guard_auth_user_insert();


-- ---------------------------------------------------------------------------
-- 2 y 3. Contraseña y correo
-- ---------------------------------------------------------------------------
create or replace function public.issue_password_change_ticket(p_user uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_user is null then
    return false;
  end if;
  -- Limpieza acotada de permisos caducados que nunca se usaron.
  delete from public.credential_change_tickets t
  where t.ctid = any (array(
    select x.ctid from public.credential_change_tickets x
    where x.expires_at < now() limit 20 for update skip locked
  ));
  insert into public.credential_change_tickets (user_id, expires_at)
  values (p_user, now() + interval '2 minutes')
  on conflict (user_id) do update set expires_at = excluded.expires_at;
  return true;
end;
$$;

create or replace function public.guard_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select c.enforce from public.auth_guard_config c where c.id) then
    return new;
  end if;

  if new.email is distinct from old.email
     or (coalesce(new.email_change, '') is distinct from coalesce(old.email_change, '')
         and coalesce(new.email_change, '') <> '') then
    raise exception 'El correo de una cuenta de BytePath no se puede cambiar'
      using errcode = 'check_violation';
  end if;

  if new.encrypted_password is distinct from old.encrypted_password then
    delete from public.credential_change_tickets t
    where t.user_id = new.id and t.expires_at >= now();
    if not found then
      raise exception 'La contraseña solo se cambia desde BytePath'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_auth_user_update on auth.users;
create trigger guard_auth_user_update
  before update on auth.users
  for each row
  when (
    new.encrypted_password is distinct from old.encrypted_password
    or new.email is distinct from old.email
    or new.email_change is distinct from old.email_change
  )
  execute function public.guard_auth_user_update();


-- ---------------------------------------------------------------------------
-- Permisos: solo el servidor emite pruebas y permisos; nadie más ejecuta nada.
-- ---------------------------------------------------------------------------
revoke execute on function public._signup_proof_mac(text, bigint) from public, anon, authenticated, service_role;
revoke execute on function public._signup_proof_valid(text, text) from public, anon, authenticated, service_role;
revoke execute on function public.guard_auth_user_insert() from public, anon, authenticated, service_role;
revoke execute on function public.guard_auth_user_update() from public, anon, authenticated, service_role;
revoke execute on function public.issue_signup_proof(text) from public, anon, authenticated;
revoke execute on function public.issue_password_change_ticket(uuid) from public, anon, authenticated;
grant execute on function public.issue_signup_proof(text) to service_role;
grant execute on function public.issue_password_change_ticket(uuid) to service_role;
