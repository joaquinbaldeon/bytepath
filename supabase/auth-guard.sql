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
