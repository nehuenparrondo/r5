import rateLimit from 'express-rate-limit';

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
