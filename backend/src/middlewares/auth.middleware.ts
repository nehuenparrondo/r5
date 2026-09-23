import type { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/jwt.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.auth_token as string | undefined;

  if (!token) {
    res.status(401).json({ ok: false, message: 'Sesión requerida.' });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = { userId: Number(payload.sub), role: payload.role, provider: payload.provider };
    next();
  } catch {
    res.clearCookie('auth_token');
    res.status(401).json({ ok: false, message: 'Sesión inválida o vencida.' });
  }
};

// Este archivo exporta: requireAuth.
// Se usa en: rutas privadas.
// Importa de: utils/jwt.ts.
