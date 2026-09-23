/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: proteger la vinculacion explicita de cuentas contra CSRF.
 */
import type { RequestHandler } from 'express';
import { allowedOrigins } from '../config/env.js';

// Esta operacion exige JSON y un Origin propio ademas de la cookie de sesion.
export const oauthLinkGuard: RequestHandler = (req, res, next) => {
  if (!req.is('application/json') || !allowedOrigins.includes(req.get('Origin') ?? '')) {
    res.status(403).json({ ok: false, message: 'Origen de vinculacion no permitido.' });
    return;
  }
  next();
};
// This file exports: oauthLinkGuard.
// It is used by: oauthRoutes.
// It imports from: Express y allowedOrigins.
