-- ===========================================================================
-- BytePath · migración 0002: exigir la aceptación de los Términos en el alta
--
-- PASO DE "ENDURECER" (contract). Ejecutar SOLO cuando:
--   1. setup.sql ya está aplicado (crea legal_config con la exigencia en falso);
--   2. está desplegada la versión de la aplicación que envía `terms_version`
--      en el registro (src/lib/auth/actions.ts, signUpAction);
--   3. se ha comprobado que un registro de prueba deja su fila en
--      public.legal_acceptances.
--
-- Antes de esto, el trigger registra la aceptación cuando llega y deja pasar el
-- alta cuando no llega (compatibilidad con código antiguo). Después, un alta
-- sin la versión vigente se rechaza entera, también si alguien llama a Supabase
-- Auth directamente con la clave pública.
--
-- Idempotente. Para volver atrás: set require_terms_on_signup = false.
-- ===========================================================================

update public.legal_config
   set require_terms_on_signup = true
 where id;

select require_terms_on_signup as "exigencia activada" from public.legal_config;
