import { z } from 'zod';
import { normalizeDisplayName, normalizeEmail, normalizeUsername } from '../utils/normalize.js';

const usernameRegex = /^[a-zA-Z0-9_.]{3,40}$/;
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(72);

export const registerSchema = z
  .object({
    email: z.string().email().transform(normalizeEmail),
    username: z.string().transform(normalizeUsername).refine((v) => usernameRegex.test(v), {
      message: 'El username debe tener 3-40 caracteres y usar solo letras, números, _ o .'
    }),
    displayName: z.string().min(2).max(80).transform(normalizeDisplayName),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.'
  });

export const loginSchema = z.object({
  login: z.string().min(1).max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1).max(72)
});

export const verifyEmailSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, 'Token de verificación inválido.')
});

export const profileUpdateSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  username: z.string().transform(normalizeUsername).refine((v) => usernameRegex.test(v), {
    message: 'El username debe tener 3-40 caracteres y usar solo letras, números, _ o .'
  }),
  displayName: z.string().min(2).max(80).transform(normalizeDisplayName),
  bio: z.string().max(280).transform((v) => v.trim())
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: passwordSchema,
    confirmNewPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Las contraseñas nuevas no coinciden.'
  });

export const emptySchema = z.object({}).strict();

// Este archivo exporta: esquemas Zod del API.
// Se usa en: rutas mediante middleware validate.
// Importa de: zod y utils/normalize.ts.
