import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { writeAuditLog } from '../utils/audit.js';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       u.id,
       u.email,
       u.username,
       r.name AS role,
       p.display_name AS displayName,
       p.bio,
       (u.email_verified_at IS NOT NULL) AS emailVerified,
       u.created_at AS createdAt
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     INNER JOIN user_profiles p ON p.user_id = u.id
     ORDER BY u.created_at DESC`
  );

  await writeAuditLog(req.auth!.userId, 'admin_users_listed', req.ip, { count: rows.length });
  res.json({ ok: true, users: rows });
};

// Este archivo exporta: listUsers.
// Se usa en: routes/admin.routes.ts.
// Importa de: MySQL y auditoría.
