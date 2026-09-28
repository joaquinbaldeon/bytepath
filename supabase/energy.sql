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
