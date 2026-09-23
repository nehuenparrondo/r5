import type { NextFunction, Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT r.name AS role
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [req.auth!.userId]
  );

  if (rows[0]?.role !== 'admin') {
    res.status(403).json({ ok: false, message: 'Acceso restringido.' });
    return;
  }

  next();
};

// Este archivo exporta: requireAdmin.
// Se usa en: rutas de administración.
// Importa de: Express y config/db.ts para validar el rol real en MySQL.
