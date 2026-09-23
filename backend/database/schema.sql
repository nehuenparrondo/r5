CREATE DATABASE IF NOT EXISTS sistema_usuarios
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_usuarios;

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO roles (name)
VALUES ('user'), ('admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL,
  email VARCHAR(254) NOT NULL,
  username VARCHAR(40) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email_verified_at TIMESTAMP NULL DEFAULT NULL,
  email_verification_token_hash CHAR(64) NULL,
  email_verification_expires_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_verification_token UNIQUE (email_verification_token_hash),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  bio VARCHAR(280) NOT NULL DEFAULT '',
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  ip_address VARCHAR(45) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user_created (user_id, created_at),
  INDEX idx_audit_action_created (action, created_at),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: agregar cuentas y transacciones OAuth en MySQL.
 */
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider_user_id VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  email_at_provider VARCHAR(254) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_oauth_identity UNIQUE (provider, provider_user_id),
  INDEX idx_oauth_user (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_flows (
  state_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  browser_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  code_verifier VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  frontend_origin VARCHAR(300) NOT NULL,
  link_user_id BIGINT UNSIGNED NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_oauth_expiry (expires_at),
  CONSTRAINT fk_oauth_flow_user FOREIGN KEY (link_user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;

-- This file exports: tablas oauth_accounts y oauth_flows.
-- It is used by: migrateOAuth.ts y schema.sql.
-- It imports from: tabla users de la base original.

-- Crear un usuario de aplicación con mínimo privilegio.
-- Ejecutar como administrador de MySQL y reemplazar la contraseña:
-- CREATE USER 'sistema_app'@'localhost' IDENTIFIED BY 'clave_muy_segura';
-- GRANT SELECT, INSERT, UPDATE ON sistema_usuarios.* TO 'sistema_app'@'localhost';
-- FLUSH PRIVILEGES;
