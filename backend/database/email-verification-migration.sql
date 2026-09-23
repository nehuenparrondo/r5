USE sistema_usuarios;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER password_hash,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash CHAR(64) NULL AFTER email_verified_at,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at DATETIME NULL AFTER email_verification_token_hash;

UPDATE users
SET email_verified_at = CURRENT_TIMESTAMP
WHERE email_verified_at IS NULL
  AND email_verification_token_hash IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_verification_token
  ON users (email_verification_token_hash);
