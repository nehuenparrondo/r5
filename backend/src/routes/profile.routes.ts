import { Router } from 'express';
import { changePassword, updateProfile } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validateBody } from '../middlewares/validate.js';
import { changePasswordSchema, profileUpdateSchema } from '../validation/schemas.js';

export const profileRouter = Router();

profileRouter.post('/update', requireAuth, validateBody(profileUpdateSchema), asyncHandler(updateProfile));
profileRouter.post('/change-password', requireAuth, validateBody(changePasswordSchema), asyncHandler(changePassword));

// Este archivo exporta: profileRouter.
// Se usa en: app.ts.
// Importa de: controladores, autenticación y validación.
