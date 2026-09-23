import { Router } from 'express';
import { listUsers } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validate.js';
import { emptySchema } from '../validation/schemas.js';

export const adminRouter = Router();

adminRouter.post(
  '/users',
  requireAuth,
  requireAdmin,
  validateBody(emptySchema),
  asyncHandler(listUsers)
);

// Este archivo exporta: adminRouter.
// Se usa en: app.ts.
// Importa de: controladores y middlewares de seguridad.
