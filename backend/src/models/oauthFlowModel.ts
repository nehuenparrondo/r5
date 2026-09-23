/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: conservar y consumir transacciones OAuth una sola vez.
 */
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db.js';
import { digest, validateFlow } from '../services/oauthService.js';
import { OAuthError, type OAuthFlow } from '../types/oauth.js';

export const saveFlow = async (flow: OAuthFlow): Promise<void> => {
  await pool.execute('DELETE FROM oauth_flows WHERE expires_at <= CURRENT_TIMESTAMP');
  await pool.execute(
    `INSERT INTO oauth_flows
     (state_hash, browser_hash, provider, code_verifier, frontend_origin, link_user_id, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      flow.stateHash,
      flow.browserHash,
      flow.provider,
      flow.verifier,
      flow.frontendOrigin,
      flow.linkUserId,
      flow.expiresAt
    ]
  );
};

// El bloqueo y borrado atomico impiden repetir un callback incluso con varios procesos.
export const consumeFlow = async (
  state: string,
  browser: unknown,
  provider: string
): Promise<OAuthFlow> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT state_hash AS stateHash, browser_hash AS browserHash, provider,
       code_verifier AS verifier, frontend_origin AS frontendOrigin,
       link_user_id AS linkUserId, expires_at AS expiresAt
       FROM oauth_flows WHERE state_hash = ? FOR UPDATE`,
      [digest(state)]
    );
    if (!rows[0]) throw new OAuthError('invalid_state');
    const flow = rows[0] as RowDataPacket & OAuthFlow;
    validateFlow(flow, state, browser, provider);
    await connection.execute('DELETE FROM oauth_flows WHERE state_hash = ?', [flow.stateHash]);
    await connection.commit();
    return flow;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
// This file exports: saveFlow y consumeFlow.
// It is used by: oauthController.
// It imports from: MySQL, pool, oauthService y tipos OAuth.
