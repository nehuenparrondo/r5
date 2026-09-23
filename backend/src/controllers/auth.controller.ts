import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { isMailtrapConfigured, sendVerificationEmail } from '../services/email.service.js';
import { writeAuditLog } from '../utils/audit.js';
import { issueAuthSession } from '../utils/authSession.js';

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  username: string;
  password_hash: string | null;
  role: 'user' | 'admin';
  display_name: string;
  bio: string;
  email_verified_at: Date | null;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, displayName, password } = req.body;

  if (!isMailtrapConfigured()) {
    res.status(503).json({
      ok: false,
      message: 'Mailtrap todavía no está configurado en el servidor.'
    });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [duplicates] = await connection.execute<RowDataPacket[]>(
      `SELECT id
       FROM users
       WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
          OR LOWER(TRIM(username)) = LOWER(TRIM(?))
       LIMIT 1`,
      [email, username]
    );

    if (duplicates.length > 0) {
      await connection.rollback();
      res.status(409).json({ ok: false, message: 'El email o username ya está registrado.' });
      return;
    }

    const [roles] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM roles WHERE name = ? LIMIT 1`,
      ['user']
    );

    if (roles.length === 0) {
      throw new Error('No existe el rol user.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [userResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO users (
         role_id, email, username, password_hash,
         email_verification_token_hash, email_verification_expires_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [roles[0].id, email, username, passwordHash, verificationTokenHash, verificationExpiresAt]
    );

    await connection.execute(
      `INSERT INTO user_profiles (user_id, display_name, bio)
       VALUES (?, ?, '')`,
      [userResult.insertId, displayName]
    );

    await sendVerificationEmail(email, displayName, verificationToken);
    await connection.commit();
    await writeAuditLog(userResult.insertId, 'user_registered', req.ip);

    res.status(201).json({
      ok: true,
      message: 'Cuenta creada. Revisá tu email para verificarla antes de ingresar.'
    });
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

export const login = async (req: Request, res: Response): Promise<void> => {
  const { login: loginValue, password } = req.body;

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT
       u.id, u.email, u.username, u.password_hash, u.email_verified_at,
       r.name AS role, p.display_name, p.bio
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     INNER JOIN user_profiles p ON p.user_id = u.id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(?))
        OR LOWER(TRIM(u.username)) = LOWER(TRIM(?))
     LIMIT 1`,
    [loginValue, loginValue]
  );

  const user = rows[0];

  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    await writeAuditLog(user?.id ?? null, 'login_failed', req.ip);
    res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
    return;
  }

  if (!user.email_verified_at) {
    await writeAuditLog(user.id, 'login_unverified_email', req.ip);
    res
      .status(403)
      .json({ ok: false, message: 'Primero verificá tu email desde el enlace que enviamos.' });
    return;
  }

  issueAuthSession(res, user.id, user.role);
  await writeAuditLog(user.id, 'login_success', req.ip);

  res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
      bio: user.bio
    }
  });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const tokenHash = createHash('sha256').update(req.body.token).digest('hex');
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users
     SET email_verified_at = CURRENT_TIMESTAMP,
         email_verification_token_hash = NULL,
         email_verification_expires_at = NULL
     WHERE email_verification_token_hash = ?
       AND email_verification_expires_at > CURRENT_TIMESTAMP
       AND email_verified_at IS NULL`,
    [tokenHash]
  );

  if (result.affectedRows === 0) {
    res.status(400).json({ ok: false, message: 'El enlace es inválido o ya venció.' });
    return;
  }

  res.json({ ok: true, message: 'Email verificado. Ya podés iniciar sesión.' });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.auth) {
    await writeAuditLog(req.auth.userId, 'logout', req.ip);
  }

  res.clearCookie('auth_token', { path: '/' });
  res.json({ ok: true, message: 'Sesión cerrada.' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT
       u.id, u.email, u.username, u.password_hash,
       u.email_verified_at, r.name AS role, p.display_name, p.bio
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     INNER JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [req.auth!.userId]
  );

  const user = rows[0];

  if (!user) {
    res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    return;
  }

  res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      displayName: user.display_name,
      bio: user.bio,
      hasPassword: Boolean(user.password_hash),
      emailVerified: Boolean(user.email_verified_at),
      authProvider: req.auth?.provider ?? null
    }
  });
};

// Este archivo exporta: register, login, logout y me.
// Se usa en: routes/auth.routes.ts.
// Importa de: bcrypt, MySQL, Express, JWT y auditoría.
