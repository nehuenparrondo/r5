import { pool } from '../config/db.js';

export const writeAuditLog = async (
  userId: number | null,
  action: string,
  ipAddress: string | undefined,
  metadata: Record<string, unknown> | null = null
): Promise<void> => {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, action, ip_address, metadata_json)
     VALUES (?, ?, ?, ?)`,
    [userId, action, ipAddress ?? null, metadata ? JSON.stringify(metadata) : null]
  );
};

// Este archivo exporta: writeAuditLog.
// Se usa en: autenticación, perfil y administración.
// Importa de: config/db.ts.
