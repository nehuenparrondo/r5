/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: aplicar la extension OAuth sobre una base MySQL existente.
 */
import { readFile } from 'node:fs/promises';
import { pool } from '../config/db.js';

// El archivo SQL solo contiene instrucciones locales conocidas; no datos del usuario.
const main = async (): Promise<void> => {
  const sql = await readFile(
    new URL('../../database/oauth-migration.sql', import.meta.url),
    'utf8'
  );
  const statements = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) await pool.query(statement);
  console.log('Migracion OAuth aplicada. Los usuarios y hashes anteriores se conservan.');
};
main()
  .catch(() => {
    console.error(
      'No se pudo aplicar OAuth. Revisar conexion, permisos y migracion de email previa.'
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
// This file exports: ningun simbolo; ejecuta la migracion.
// It is used by: npm run migrate-oauth.
// It imports from: node:fs/promises y pool MySQL.
