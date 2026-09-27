-- ===========================================================================
-- BytePath · migración 0004: altas y credenciales solo a través del servidor
--
-- PASO DE "ENDURECER" (contract), como 0002. Ejecutar SOLO cuando:
--   1. setup.sql ya está aplicado (crea auth-guard.sql con la exigencia en
--      falso: guard_auth_user_insert, guard_auth_user_update y sus funciones);
--   2. está desplegada la versión de la aplicación que pide la prueba de alta
--      (issue_signup_proof) y el permiso de contraseña
--      (issue_password_change_ticket), con SUPABASE_SERVICE_ROLE_KEY definida;
--   3. se ha comprobado en producción, CON LA EXIGENCIA TODAVÍA DESACTIVADA:
--        · un registro de prueba desde el formulario: su fila de auth.users NO
--          contiene 'signup_proof' en raw_user_meta_data (el trigger la quita);
--        · un inicio de sesión y un cambio de contraseña desde /cuenta.
--
-- Después de esto:
--   · un alta que no venga del servidor de BytePath (POST /auth/v1/signup con
--     la clave pública, OTP que crea usuarios, registro anónimo) se rechaza;
--   · cambiar la contraseña sin el permiso del servidor (PUT /auth/v1/user con
--     una sesión robada) se rechaza;
--   · cambiar el correo se rechaza (BytePath no lo ofrece).
--   También desde el panel de Supabase: ver auth-guard.sql para una operación
--   manual de administración.
--
-- Idempotente. Para volver atrás: update public.auth_guard_config set enforce = false where id;
-- ===========================================================================

update public.auth_guard_config
   set enforce = true
 where id;

select enforce as "exigencia activada" from public.auth_guard_config;
