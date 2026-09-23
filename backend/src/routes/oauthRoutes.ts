/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: publicar las rutas genericas de login social.
 */
import { Router } from 'express';
import {
  linkedAccounts,
  listProviders,
  oauthCallback,
  startOAuth
} from '../controllers/oauthController.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { oauthLinkGuard } from '../middlewares/oauthLinkGuard.js';
import { oauthLimiter } from '../middlewares/rateLimiters.js';
import { validateBody } from '../middlewares/validate.js';
import { emptySchema } from '../validation/schemas.js';

export const oauthRouter = Router();
// Las rutas estaticas preceden al parametro provider.
oauthRouter.get('/providers', listProviders);
oauthRouter.post('/accounts', requireAuth, validateBody(emptySchema), asyncHandler(linkedAccounts));
oauthRouter.post(
  '/:provider/link',
  oauthLimiter,
  requireAuth,
  oauthLinkGuard,
  validateBody(emptySchema),
  asyncHandler(startOAuth)
);
oauthRouter.get('/:provider/callback', oauthLimiter, asyncHandler(oauthCallback));
oauthRouter.get('/:provider', oauthLimiter, asyncHandler(startOAuth));
// This file exports: oauthRouter.
// It is used by: app.ts.
// It imports from: Express, controladores, middlewares y validadores.
