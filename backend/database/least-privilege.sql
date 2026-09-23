/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: documentar permisos minimos para el modulo OAuth en MySQL.
 */
-- Ejecutar como administrador, sustituyendo base, usuario y host si corresponde.
GRANT SELECT, INSERT ON sistema_usuarios.oauth_accounts TO 'sistema_app'@'localhost';
GRANT SELECT, INSERT, DELETE ON sistema_usuarios.oauth_flows TO 'sistema_app'@'localhost';
-- users, user_profiles, roles y audit_logs conservan los permisos de la base original.
-- La cuenta de migracion necesita CREATE, ALTER, INDEX y REFERENCES; la app no.
-- No se implementa desvinculado, por lo que no se concede DELETE en oauth_accounts.
-- This file exports: permisos SQL del modulo OAuth.
-- It is used by: administrador de la base.
-- It imports from: tablas OAuth.
