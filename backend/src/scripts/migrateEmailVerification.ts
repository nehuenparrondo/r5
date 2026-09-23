import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

const main = async (): Promise<void> => {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER password_hash,
      ADD COLUMN IF NOT EXISTS email_verification_token_hash CHAR(64) NULL AFTER email_verified_at,
      ADD COLUMN IF NOT EXISTS email_verification_expires_at DATETIME NULL AFTER email_verification_token_hash
  `);

  await pool.query(`
    UPDATE users
    SET email_verified_at = CURRENT_TIMESTAMP
    WHERE email_verified_at IS NULL
      AND email_verification_token_hash IS NULL
  `);

  const [indexes] = await pool.query<RowDataPacket[]>(`
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND INDEX_NAME = 'uq_users_verification_token'
  `);

  if (indexes.length === 0) {
    await pool.query(`
      CREATE UNIQUE INDEX uq_users_verification_token
      ON users (email_verification_token_hash)
    `);
  }

  console.log('Migración de verificación de email aplicada correctamente.');
};

main()
  .catch((error) => {
    console.error('No se pudo aplicar la migración de email:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
