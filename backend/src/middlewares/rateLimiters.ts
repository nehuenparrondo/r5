import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Cada inicio y callback comparte un limite acotado de intentos OAuth.
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler(req, res) {
    if (req.method === 'POST') {
      res.status(429).json({ ok: false, message: 'oauth_rate_limited' });
      return;
    }
    res.redirect(303, new URL('/login?error=oauth_rate_limited', env.APP_URL).href);
  }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos. Intentá nuevamente más tarde.' }
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados registros desde esta conexión.' }
});

// Este archivo exporta: loginLimiter y registerLimiter.
// Se usa en: rutas de autenticación.
// Importa de: express-rate-limit.
