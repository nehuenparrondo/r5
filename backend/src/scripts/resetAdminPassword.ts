/*
 * Archivo documentado para la entrega R5.
 * Funcion principal: restablecer de forma interactiva la contraseña de un administrador existente.
 */
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2';
import { stdin, stdout } from 'node:process';
import { pool } from '../config/db.js';
import { normalizeEmail } from '../utils/normalize.js';

type AdminRow = RowDataPacket & { id: number };

const [rawEmail] = process.argv.slice(2);

if (!rawEmail) {
  console.error('Uso: npm run reset-admin-password -- admin@ejemplo.com');
  process.exit(1);
}

const readHidden = (prompt: string): Promise<string> => {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Este comando necesita una consola interactiva para ocultar la contraseña.');
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    let value = '';

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };

    const onData = (chunk: string | Buffer) => {
      const key = String(chunk);

      if (key === '\u0003') {
        cleanup();
        reject(new Error('Operación cancelada.'));
        return;
      }

      if (key === '\r' || key === '\n') {
        cleanup();
        resolve(value);
        return;
      }

      if (key === '\u007f' || key === '\b') {
        if (value.length > 0) value = value.slice(0, -1);
        return;
      }

      if (!key.startsWith('\u001b')) value += key;
    };

    stdin.on('data', onData);
  });
};

const main = async (): Promise<void> => {
  const email = normalizeEmail(rawEmail);
  const [admins] = await pool.execute<AdminRow[]>(
    `SELECT u.id
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND r.name = 'admin'
     LIMIT 1`,
    [email]
  );

  if (!admins[0]) throw new Error('No existe un administrador con ese email.');

  const newPassword = await readHidden('Nueva contraseña: ');
  const confirmation = await readHidden('Repetir nueva contraseña: ');

  if (newPassword.length < 6 || newPassword.length > 72) {
    throw new Error('La contraseña debe tener entre 6 y 72 caracteres.');
  }

  if (newPassword !== confirmation) throw new Error('Las contraseñas no coinciden.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
    passwordHash,
    admins[0].id
  ]);

  console.log('Contraseña del administrador actualizada correctamente.');
};

main()
  .catch((error) => {
    console.error('No se pudo restablecer la contraseña:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

// Este archivo ejecuta: una actualización bcrypt limitada a usuarios con rol admin.
// Se usa desde: la consola interactiva del backend local o publicado.
// Importa de: bcrypt, MySQL, process, configuración de base y normalización de email.
