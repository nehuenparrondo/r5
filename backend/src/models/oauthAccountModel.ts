/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: guardar usuarios y vinculos sociales con consultas parametrizadas.
 */
import { randomBytes } from 'node:crypto';
import type { PoolConnection } from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { sendVerificationEmail } from '../services/email.service.js';
import { digest, randomSecret } from '../services/oauthService.js';
import {
  resolveOAuthIdentity,
  type IdentityStore,
  type IdentityUser
} from '../services/oauthIdentityService.js';
import { OAuthError, type OAuthProfile } from '../types/oauth.js';

const userSelect = `SELECT u.id, u.email, r.name AS role, p.display_name AS displayName,
  (u.email_verified_at IS NOT NULL) AS emailVerified FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  INNER JOIN user_profiles p ON p.user_id = u.id`;
const readUser = async (
  connection: PoolConnection,
  sql: string,
  values: (string | number)[]
): Promise<IdentityUser | null> => {
  const [rows] = await connection.execute<RowDataPacket[]>(sql, values);
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    role: rows[0].role,
    email: rows[0].email,
    displayName: rows[0].displayName,
    emailVerified: Boolean(rows[0].emailVerified)
  };
};

// Toda la decision y la auditoria usan la misma transaccion.
const makeStore = (
  connection: PoolConnection,
  provider: string,
  ip: string | undefined
): IdentityStore => ({
  findLinked: (providerName, subject) =>
    readUser(
      connection,
      `${userSelect} INNER JOIN oauth_accounts oa ON oa.user_id = u.id
     WHERE oa.provider = ? AND oa.provider_user_id = ? FOR UPDATE`,
      [providerName, subject]
    ),
  findByEmail: (email) =>
    readUser(connection, `${userSelect} WHERE LOWER(TRIM(u.email)) = ? LIMIT 1 FOR UPDATE`, [
      email
    ]),
  findById: (id) => readUser(connection, `${userSelect} WHERE u.id = ? FOR UPDATE`, [id]),
  async createUser(profile) {
    const [roles] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM roles WHERE name = ?',
      ['user']
    );
    if (!roles[0]) throw new OAuthError('configuration');
    const username = `u_${randomBytes(16).toString('hex')}`;
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO users (role_id, email, username, password_hash, email_verified_at)
       VALUES (?, ?, ?, NULL, ?)`,
      [roles[0].id, profile.email, username, profile.emailVerified ? new Date() : null]
    );
    await connection.execute(
      'INSERT INTO user_profiles (user_id, display_name, bio) VALUES (?, ?, ?)',
      [result.insertId, profile.name, '']
    );
    return {
      id: result.insertId,
      role: 'user',
      email: profile.email,
      displayName: profile.name,
      emailVerified: profile.emailVerified
    };
  },
  async link(userId, providerName, profile) {
    await connection.execute(
      'INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email_at_provider) VALUES (?, ?, ?, ?)',
      [userId, providerName, profile.providerUserId, profile.email]
    );
  },
  async audit(userId, event) {
    await connection.execute(
      'INSERT INTO audit_logs (user_id, action, ip_address, metadata_json) VALUES (?, ?, ?, ?)',
      [userId, event, ip ?? null, JSON.stringify({ provider })]
    );
  },
  async requestVerification(user) {
    const token = randomSecret();
    await connection.execute(
      `UPDATE users SET email_verification_token_hash = ?, email_verification_expires_at = ?
       WHERE id = ? AND email_verified_at IS NULL`,
      [digest(token), new Date(Date.now() + 24 * 60 * 60 * 1000), user.id]
    );
    try {
      await sendVerificationEmail(user.email, user.displayName, token);
    } catch {
      throw new OAuthError('verification_unavailable');
    }
  }
});

export const authenticateOAuthAccount = async (
  provider: string,
  profile: OAuthProfile,
  linkUserId: number | null,
  ip: string | undefined
) => {
  // Un callback concurrente puede competir por el mismo email o vinculo UNIQUE.
  for (let attempt = 0; attempt < 3; attempt++) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await resolveOAuthIdentity(
        makeStore(connection, provider, ip),
        provider,
        profile,
        linkUserId
      );
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      const code = (error as { code?: string }).code;
      if (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'].includes(code ?? '') && attempt < 2) continue;
      throw error;
    } finally {
      connection.release();
    }
  }
  throw new OAuthError('account_conflict');
};

export const listOAuthAccounts = async (userId: number) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, provider, email_at_provider AS email, created_at AS createdAt
     FROM oauth_accounts WHERE user_id = ? ORDER BY created_at, id`,
    [userId]
  );
  return rows;
};
// This file exports: authenticateOAuthAccount y listOAuthAccounts.
// It is used by: oauthController.
// It imports from: crypto, MySQL, pool, email, servicios y tipos OAuth.
