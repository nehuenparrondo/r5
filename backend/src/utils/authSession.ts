/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: compartir la misma cookie JWT entre login local y social.
 */
import type { Response } from 'express';
import { env } from '../config/env.js';
import { signAuthToken } from './jwt.js';

// Se conservan nombre, duracion y atributos de la sesion original.
export const issueAuthSession = (
  res: Response,
  userId: number,
  role: 'user' | 'admin',
  provider?: string
): void => {
  res.cookie('auth_token', signAuthToken({ sub: String(userId), role, provider }), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });
};
// This file exports: issueAuthSession.
// It is used by: auth.controller y oauthController.
// It imports from: Express, env y jwt.
