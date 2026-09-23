import { Router } from 'express';
import { login, logout, me, register, verifyEmail } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiters.js';
import { validateBody } from '../middlewares/validate.js';
import { emptySchema, loginSchema, registerSchema, verifyEmailSchema } from '../validation/schemas.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validateBody(registerSchema), register);
authRouter.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), login);
authRouter.post('/logout', requireAuth, validateBody(emptySchema), logout);
authRouter.post('/me', requireAuth, validateBody(emptySchema), me);

// Este archivo exporta: authRouter.
// Se usa en: app.ts.
// Importa de: controladores y middlewares de autenticación.
