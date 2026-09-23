import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        ok: false,
        message: 'Hay datos inválidos.',
        errors: result.error.flatten().fieldErrors
      });
      return;
    }

    req.body = result.data;
    next();
  };

// Este archivo exporta: validateBody.
// Se usa en: rutas de auth, perfil y admin.
// Importa de: Express y Zod.
