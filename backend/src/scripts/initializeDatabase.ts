/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: inicializar de forma idempotente una base MySQL vacia al desplegar.
 */
import { readFile } from 'node:fs/promises';
import { pool } from '../config/db.js';

const schemaPath = new URL('../../database/schema.sql', import.meta.url);

const initializeDatabase = async (): Promise<void> => {
  const source = await readFile(schemaPath, 'utf8');
  const portableSource = source
    .replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;/i, '')
    .replace(/\bUSE\s+[^;]+;/i, '');
  const statements = portableSource
    .split(';')
    .map((statement) => statement.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);

  for (const statement of statements) await pool.query(statement);
  await pool.end();
  console.log('Base MySQL inicializada y migraciones R5 verificadas.');
};

initializeDatabase().catch(async (error) => {
  console.error('No se pudo inicializar la base MySQL:', error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});

// Este archivo inicia: el esquema relacional completo antes del servidor de producción.
// Se usa al ejecutar: npm run start:production.
// Importa de: node:fs/promises y pool MySQL.
