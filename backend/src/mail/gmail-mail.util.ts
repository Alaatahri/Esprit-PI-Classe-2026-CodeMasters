import * as nodemailer from 'nodemailer';
import { getSmtpCredentials } from './smtp-env';

/**
 * Transporter Gmail / SMTP : STARTTLS sur le port 587 (secure: false).
 * Variables : MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS (mot de passe d’application).
 */
export function createGmailSmtpTransporter(): nodemailer.Transporter {
  const creds = getSmtpCredentials();
  if (!creds) {
    throw new Error(
      'SMTP non configuré : définissez MAIL_USER et MAIL_PASS (et optionnellement MAIL_HOST, MAIL_PORT).',
    );
  }

  const host = process.env.MAIL_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT) || 587;
  const secure =
    process.env.MAIL_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: creds.user, pass: creds.pass },
    ...(secure ? {} : { requireTLS: true }),
    tls: {
      rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });
}

/** Expéditeur : MAIL_FROM ou « BMP.tn » &lt;MAIL_USER&gt; */
export function getMailFromHeader(): string {
  const explicit = process.env.MAIL_FROM?.trim();
  if (explicit) return explicit;
  const user = process.env.MAIL_USER?.trim();
  if (user) return `BMP.tn <${user}>`;
  return 'BMP.tn <noreply@bmp.tn>';
}

export async function sendMailViaGmailSmtp(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const transporter = createGmailSmtpTransporter();
  await transporter.sendMail({
    from: getMailFromHeader(),
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
