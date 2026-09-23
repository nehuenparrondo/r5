/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: enviar rechazos asincronos al errorHandler de Express 4.
 */
import type { RequestHandler } from 'express';

// Express 4 no propaga automaticamente las promesas rechazadas.
export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
// This file exports: asyncHandler.
// It is used by: rutas OAuth.
// It imports from: tipos Express.
