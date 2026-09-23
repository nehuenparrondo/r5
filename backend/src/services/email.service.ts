import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export const isMailtrapConfigured = (): boolean => Boolean(env.MAILTRAP_USER && env.MAILTRAP_PASS);

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]!));

export const sendVerificationEmail = async (
  email: string,
  displayName: string,
  token: string
): Promise<void> => {
  if (!isMailtrapConfigured()) {
    throw new Error('Mailtrap no está configurado. Completá MAILTRAP_USER y MAILTRAP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: env.MAILTRAP_PORT,
    secure: env.MAILTRAP_PORT === 465,
    auth: {
      user: env.MAILTRAP_USER,
      pass: env.MAILTRAP_PASS
    }
  });
  const verificationUrl = `${env.APP_URL}/verificar-email?token=${encodeURIComponent(token)}`;
  const safeDisplayName = escapeHtml(displayName);

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Verificá tu cuenta',
    text: `Hola ${displayName}. Verificá tu cuenta desde este enlace: ${verificationUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24213a">
        <div style="display:inline-block;padding:9px 13px;border-radius:12px;background:#6d4aff;color:#fff;font-weight:700">Usuarios SQL</div>
        <h1 style="margin:28px 0 12px">Verificá tu email</h1>
        <p style="line-height:1.6;color:#625d76">Hola ${safeDisplayName}, tu cuenta ya fue creada. Solo falta confirmar que este email es tuyo.</p>
        <a href="${verificationUrl}" style="display:inline-block;margin:18px 0;padding:14px 22px;border-radius:12px;background:#6d4aff;color:#fff;text-decoration:none;font-weight:700">Verificar mi cuenta</a>
        <p style="font-size:13px;line-height:1.5;color:#827d91">Este enlace vence en 24 horas. Si no creaste esta cuenta, podés ignorar el mensaje.</p>
      </div>
    `
  });
};
