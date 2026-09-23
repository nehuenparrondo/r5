import { Router } from 'express';
import { changePassword, updateProfile } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.js';
import { changePasswordSchema, profileUpdateSchema } from '../validation/schemas.js';

export const profileRouter = Router();

profileRouter.post('/update', requireAuth, validateBody(profileUpdateSchema), updateProfile);
profileRouter.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePassword);

// Este archivo exporta: profileRouter.
// Se usa en: app.ts.
// Importa de: controladores, autenticación y validación.
