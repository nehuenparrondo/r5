/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: verificar SQL y concurrencia en una base MySQL temporal aislada.
 */
import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';

// Solo se crea y elimina una base aleatoria nueva, nunca DB_NAME de la aplicacion.
const databaseName = `r5_oauth_test_${randomBytes(8).toString('hex')}`;
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectTimeout: 3000
});
let created = false;
let pool;
try {
  await connection.query(
    `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  created = true;
  await connection.changeUser({ database: databaseName });
  const executeFile = async (name, skipDatabase = false) => {
    const sql = await readFile(new URL(`../database/${name}`, import.meta.url), 'utf8');
    const statements = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^--.*$/gm, '')
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean);
    for (const statement of statements) {
      if (skipDatabase && /^(CREATE DATABASE|USE\s)/i.test(statement)) continue;
      await connection.query(statement);
    }
  };
  await executeFile('schema.sql', true);
  await executeFile('oauth-migration.sql');
  await executeFile('oauth-migration.sql');
  process.env.DB_NAME = databaseName;
  process.env.MAILTRAP_USER = '';
  process.env.MAILTRAP_PASS = '';
  ({ pool } = await import('../dist/config/db.js'));
  const { authenticateOAuthAccount } = await import('../dist/models/oauthAccountModel.js');
  const { saveFlow, consumeFlow } = await import('../dist/models/oauthFlowModel.js');
  const { randomSecret, digest } = await import('../dist/services/oauthService.js');
  const profile = {
    providerUserId: '12345',
    email: 'fixture@example.com',
    emailVerified: true,
    name: 'Prueba R5'
  };
  const first = await authenticateOAuthAccount('google', profile, null, '127.0.0.1');
  assert.equal(first.user.role, 'user');
  const repeated = await authenticateOAuthAccount('google', profile, null, '127.0.0.1');
  assert.equal(repeated.user.id, first.user.id);
  const github = await authenticateOAuthAccount(
    'github',
    { ...profile, providerUserId: '67890' },
    null,
    '127.0.0.1'
  );
  assert.equal(github.user.id, first.user.id);
  const racingProfile = { ...profile, providerUserId: 'race-123', email: 'race@example.com' };
  const raced = await Promise.all([
    authenticateOAuthAccount('google', racingProfile, null, '127.0.0.1'),
    authenticateOAuthAccount('google', racingProfile, null, '127.0.0.1')
  ]);
  assert.equal(raced[0].user.id, raced[1].user.id);
  const [users] = await connection.execute('SELECT password_hash FROM users WHERE id = ?', [
    first.user.id
  ]);
  assert.equal(users[0].password_hash, null);
  const [accounts] = await connection.execute(
    'SELECT provider FROM oauth_accounts WHERE user_id = ?',
    [first.user.id]
  );
  assert.equal(accounts.length, 2);

  const state = randomSecret();
  const browser = randomSecret();
  await saveFlow({
    stateHash: digest(state),
    browserHash: digest(browser),
    provider: 'google',
    verifier: randomSecret(),
    frontendOrigin: 'http://localhost:5173',
    linkUserId: null,
    expiresAt: new Date(Date.now() + 60000)
  });
  const consumed = await Promise.allSettled([
    consumeFlow(state, browser, 'google'),
    consumeFlow(state, browser, 'google')
  ]);
  assert.equal(consumed.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(consumed.filter((result) => result.status === 'rejected').length, 1);
  console.log('MYSQL_INTEGRATION_OK: esquema, migracion repetida, dos proveedores y concurrencia.');
} catch (error) {
  console.error('MYSQL_INTEGRATION_FAILED:', error.code ?? error.reason ?? error.message);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
  if (created && /^r5_oauth_test_[a-f0-9]{16}$/.test(databaseName)) {
    await connection.query(`DROP DATABASE \`${databaseName}\``);
    console.log('Base temporal de pruebas eliminada; la base original no se modifico.');
  }
  await connection.end();
}
// This file exports: verificacion MySQL optativa.
// It is used by: npm run test:mysql desde backend con permisos CREATE/DROP.
// It imports from: dotenv, Node, mysql2 y modulos compilados.
