-- ===========================================================================
-- BytePath · migración 0003: publicar los Términos y Condiciones 1.1
--
-- CUÁNDO: justo ANTES de desplegar el código con TERMS_VERSION = "1.1"
-- (src/lib/legal/documents.ts), una vez aplicado setup.sql.
--
-- Por qué antes: el alta y la aceptación desde /cuenta solo guardan la versión
-- que la base de datos considera vigente (la de published_at más reciente que
-- no sea futura, America/Lima). Si el código nuevo llegara antes que esta fila,
-- las altas no guardarían la aceptación (o se rechazarían con 0002 aplicada).
--
-- Qué NO hace: no toca ninguna aceptación registrada. Quien aceptó la 1.0 la
-- conserva; en /cuenta verá que la vigente es la 1.1 y podrá aceptarla.
--
-- Idempotente: si la fila ya existe, no cambia nada.
-- ===========================================================================

do $$
begin
  if to_regclass('public.legal_documents') is null then
    raise exception 'Falta public.legal_documents: aplica antes supabase/setup.sql';
  end if;
end $$;

insert into public.legal_documents (document_type, version, published_at)
values ('terms', '1.1', date '2026-09-27')
on conflict (document_type, version) do nothing;

-- Comprobación: debe decir 1.1 (si hoy, en Lima, es 2026-09-27 o posterior).
select public.current_legal_version('terms') as "versión vigente de los Términos",
       (select count(*) from public.legal_acceptances) as "aceptaciones registradas (sin cambios)";
