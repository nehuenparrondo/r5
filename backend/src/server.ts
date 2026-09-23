import { app } from './app.js';
import { pool } from './config/db.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  await pool.query('SELECT 1');

  app.listen(env.PORT, () => {
    console.log(`API segura activa en http://localhost:${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});

// Este archivo inicia: el servidor HTTP.
// Se usa al ejecutar npm run dev / npm start.
// Importa de: app, base de datos y variables de entorno.
