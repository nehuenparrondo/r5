import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  role: 'user' | 'admin';
};

export const signAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  });

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

// Este archivo exporta: signAuthToken, verifyAuthToken y AuthTokenPayload.
// Se usa en: login y middleware de autenticación.
// Importa de: jsonwebtoken y config/env.ts.
