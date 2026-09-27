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
