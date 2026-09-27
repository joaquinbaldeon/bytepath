-- ===========================================================================
-- BytePath · esquema de identidad
--
-- Ejecutar completo en el SQL Editor del panel de Supabase.
-- Es idempotente: se puede volver a ejecutar sin romper nada.
--
-- Principio de diseño: la identidad es el UUID de auth.users. El username es
-- solo el nombre público y puede cambiar; por eso ninguna tabla futura debe
-- referenciar el username, sino profiles.id / auth.users.id.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Tabla de perfiles
--
-- Solo guarda identidad pública. El email y la contraseña se quedan en
-- auth.users, gestionados por Supabase Auth: aquí no se replica nada de eso.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Debe decir lo mismo que src/lib/auth/username.ts
  constraint profiles_username_format
    check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- Unicidad insensible a mayúsculas: "Randms" y "randms" son el mismo nombre.
-- Es la garantía real de unicidad, la que resuelve dos registros simultáneos.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

comment on table public.profiles is
  'Identidad pública del usuario. La identidad interna es auth.users.id.';


-- ---------------------------------------------------------------------------
-- 2. Row Level Security
--
-- Sin políticas permisivas: nadie lee ni escribe el perfil de otro.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "perfil propio: lectura" on public.profiles;
create policy "perfil propio: lectura"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Sin política de UPDATE: el nombre de usuario no se puede cambiar desde el
-- navegador. No hay interfaz para ello, y cambiarlo directamente dejaría
-- desfasada la copia de los metadatos de Auth. Si algún día se permite, será
-- con una acción de servidor (validación, nombres reservados, límite).
drop policy if exists "perfil propio: actualización" on public.profiles;

-- No hay política de INSERT ni de DELETE a propósito:
--   · el alta la hace el trigger de abajo (SECURITY DEFINER),
--   · la baja llega en cascada al borrar el usuario de auth.users.

-- Privilegios de tabla: la segunda cerradura, igual que en el resto de tablas
-- de BytePath. Supabase concede por defecto todo a anon y authenticated; con
-- esto, aunque alguien desactivase RLS por error, anon no podría leer ni
-- escribir, y authenticated solo podría leer su propia fila.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;


-- ---------------------------------------------------------------------------
-- 3. updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 4. Creación automática del perfil
--
-- Por qué un trigger y no una inserción desde la aplicación: el alta del
-- usuario y la del perfil ocurren en la MISMA transacción. Si el username ya
-- está ocupado, el índice único falla, el trigger revienta y Supabase deshace
-- también el alta en auth.users. Nunca queda un usuario sin perfil.
--
-- Hacerlo desde la aplicación (signUp y después insert) daría una ventana en
-- la que el usuario existe pero su perfil no, y habría que limpiarla a mano.
--
-- `set search_path = ''` obliga a nombrar los objetos con su esquema y evita
-- que un search_path manipulado redirija las consultas de esta función.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text;
begin
  candidate := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  if candidate is null then
    raise exception 'Falta el username al crear la cuenta'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, username) values (new.id, candidate);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 5. Comprobar si un username está libre
--
-- SECURITY DEFINER para poder consultar profiles sin abrir la tabla a lectura
-- pública.
--
-- Devuelve solo un booleano: no filtra quién tiene ese nombre. Aun así, un
-- booleano repetido millones de veces sirve para recopilar qué nombres existen,
-- así que NO se expone al navegador: solo la ejecuta el servidor (service_role)
-- desde el registro, que además limita cuántas comprobaciones hace cada origen
-- (src/lib/auth/actions.ts).
-- Es una ayuda de interfaz, NO la garantía de unicidad; la garantía es el
-- índice único, que es quien resuelve dos registros a la vez.
-- ---------------------------------------------------------------------------
create or replace function public.username_available(candidate text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(candidate))
  );
$$;

revoke execute on function public.username_available(text) from public, anon, authenticated;
grant execute on function public.username_available(text) to service_role;
