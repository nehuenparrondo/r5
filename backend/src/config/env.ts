import 'dotenv/config';
import { z } from 'zod';

const providerEnvironment = {
  ...process.env,
  DB_HOST: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST,
  DB_PORT: process.env.DB_PORT || process.env.MYSQL_ADDON_PORT,
  DB_NAME: process.env.DB_NAME || process.env.MYSQL_ADDON_DB,
  DB_USER: process.env.DB_USER || process.env.MYSQL_ADDON_USER,
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD
};

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
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default(''),
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_REDIRECT_URI: z.string().default(''),
  DISCORD_CLIENT_ID: z.string().default(''),
  DISCORD_CLIENT_SECRET: z.string().default(''),
  DISCORD_REDIRECT_URI: z.string().default(''),
  MAILTRAP_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  MAILTRAP_PORT: z.coerce.number().int().positive().default(2525),
  MAILTRAP_USER: z.string().default(''),
  MAILTRAP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('Sistema Usuarios <no-reply@sistema-usuarios.local>')
});

export const env = envSchema.parse(providerEnvironment);
export const allowedOrigins = env.CORS_ORIGINS.split(',').map((value) => value.trim());

// Este archivo exporta: env y allowedOrigins.
// Se usa en: configuración de base de datos, JWT y servidor.
// Importa de: dotenv y zod; admite variables locales y las generadas por Clever Cloud.
