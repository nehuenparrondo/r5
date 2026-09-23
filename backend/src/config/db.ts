import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Este archivo exporta: pool de conexiones MySQL.
// Se usa en: controladores, auditoría y scripts.
// Importa de: mysql2/promise y config/env.ts.
