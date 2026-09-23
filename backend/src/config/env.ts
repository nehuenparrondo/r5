import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGINS: z.string().min(1),
  APP_URL: z.string().url().default('http://localhost:5173'),
  MAILTRAP_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  MAILTRAP_PORT: z.coerce.number().int().positive().default(2525),
  MAILTRAP_USER: z.string().default(''),
  MAILTRAP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Sistema Usuarios <no-reply@sistema-usuarios.local>')
});

export const env = envSchema.parse(process.env);
export const allowedOrigins = env.CORS_ORIGINS.split(',').map((value) => value.trim());

// Este archivo exporta: env y allowedOrigins.
// Se usa en: configuración de base de datos, JWT y servidor.
// Importa de: dotenv y zod.
