import bcrypt from 'bcrypt';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { normalizeEmail, normalizeUsername } from '../utils/normalize.js';

const [rawEmail, rawPassword, rawUsername = 'admin'] = process.argv.slice(2);

if (!rawEmail || !rawPassword) {
  console.error('Uso: npm run create-admin -- email contraseña [username]');
  process.exit(1);
}

const email = normalizeEmail(rawEmail);
const username = normalizeUsername(rawUsername);

const validPassword = /^.{6,72}$/;

if (!validPassword.test(rawPassword)) {
  console.error('La contraseña del admin debe tener entre 6 y 72 caracteres.');
  process.exit(1);
}

const main = async (): Promise<void> => {
  const [roles] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM roles WHERE name = ? LIMIT 1`,
    ['admin']
  );

  if (!roles[0]) {
    throw new Error('No existe el rol admin. Ejecutá schema.sql primero.');
  }

  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (role_id, email, username, password_hash, email_verified_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [roles[0].id, email, username, passwordHash]
  );

  await pool.execute(
    `INSERT INTO user_profiles (user_id, display_name, bio)
     VALUES (?, ?, '')`,
    [result.insertId, 'Administrador']
  );

  console.log('Administrador creado correctamente.');
};

main()
  .catch((error) => {
    console.error('No se pudo crear el admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

// Este archivo crea: el primer usuario administrador.
// Se usa desde: npm run create-admin.
// Importa de: bcrypt, base de datos y normalizadores.
