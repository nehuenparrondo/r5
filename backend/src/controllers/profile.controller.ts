import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { writeAuditLog } from '../utils/audit.js';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { email, username, displayName, bio } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // La comparación normalizada evita duplicados con mayúsculas o espacios.
    const [duplicates] = await connection.execute<RowDataPacket[]>(
      `SELECT id
       FROM users
       WHERE id <> ?
         AND (
           LOWER(TRIM(email)) = LOWER(TRIM(?))
           OR LOWER(TRIM(username)) = LOWER(TRIM(?))
         )
       LIMIT 1`,
      [req.auth!.userId, email, username]
    );

    if (duplicates.length > 0) {
      await connection.rollback();
      res.status(409).json({ ok: false, message: 'El email o username ya está registrado.' });
      return;
    }

    // El ID siempre proviene del JWT validado: el cliente no elige qué usuario modificar.
    await connection.execute(
      `UPDATE users
       SET email = ?, username = ?
       WHERE id = ?`,
      [email, username, req.auth!.userId]
    );

    await connection.execute(
      `UPDATE user_profiles
       SET display_name = ?, bio = ?
       WHERE user_id = ?`,
      [displayName, bio, req.auth!.userId]
    );

    await connection.commit();
    await writeAuditLog(req.auth!.userId, 'profile_updated', req.ip);
    res.json({ ok: true, message: 'Perfil actualizado.' });
  } catch (error: any) {
    await connection.rollback();

    if (error?.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ ok: false, message: 'El email o username ya está registrado.' });
      return;
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT password_hash FROM users WHERE id = ? LIMIT 1`,
    [req.auth!.userId]
  );

  const user = rows[0];

  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    await writeAuditLog(req.auth!.userId, 'password_change_failed', req.ip);
    res.status(400).json({ ok: false, message: 'La contraseña actual es incorrecta.' });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await pool.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [newHash, req.auth!.userId]
  );

  await writeAuditLog(req.auth!.userId, 'password_changed', req.ip);
  res.json({ ok: true, message: 'Contraseña actualizada.' });
};

// Este archivo exporta: updateProfile y changePassword.
// Se usa en: routes/profile.routes.ts.
// Importa de: bcrypt, MySQL y auditoría.
