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
