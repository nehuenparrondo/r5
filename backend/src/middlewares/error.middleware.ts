import type { NextFunction, Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada.' });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(error);
  res.status(500).json({ ok: false, message: 'Ocurrió un error interno.' });
};

// Este archivo exporta: notFoundHandler y errorHandler.
// Se usa en: app.ts como manejo centralizado.
// Importa de: Express.
