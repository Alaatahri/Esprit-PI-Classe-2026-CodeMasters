import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { isSmtpConfigured } from './smtp-env';
import { sendMailViaGmailSmtp } from './gmail-mail.util';

export type SendVerificationResult = {
  /** Lien de prévisualisation Ethereal (dev uniquement, pas de livraison dans une vraie boîte) */
  etherealPreviewUrl?: string;
  /** true = envoi via Ethereal, false = SMTP réel */
  usedEthereal?: boolean;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  isConfigured(): boolean {
    return isSmtpConfigured();
  }

  /**
   * Envoie l’e-mail de vérification vers **args.to** (l’adresse saisie à l’inscription).
   * - MAIL_* (Gmail SMTP via Nodemailer) → livraison réelle.
   * - Sinon, dev + USE_ETHEREAL_IN_DEV=true → Ethereal (pas de livraison réelle).
   */
  async sendVerificationEmail(args: {
    to: string;
    nom: string;
    token: string;
  }): Promise<SendVerificationResult> {
    const html = this.buildVerificationHtml(args);
    const subject = 'BMP.tn — Confirmez votre adresse e-mail';

    if (isSmtpConfigured()) {
      await sendMailViaGmailSmtp({ to: args.to, subject, html });
      this.logger.log(
        `E-mail de vérification envoyé vers ${args.to} (Gmail SMTP / Nodemailer)`,
      );
      return {};
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'E-mail sortant non configuré : définissez MAIL_HOST, MAIL_USER, MAIL_PASS et MAIL_FROM dans backend/.env en production.',
      );
    }

    if (process.env.USE_ETHEREAL_IN_DEV?.trim() === 'true') {
      return this.sendViaEthereal(args.to, html, subject);
    }

    throw new Error(
      'E-mail sortant non configuré : MAIL_HOST/MAIL_USER/MAIL_PASS/MAIL_FROM, ou USE_ETHEREAL_IN_DEV=true en dev.',
    );
  }

  async sendPasswordResetEmail(args: {
    to: string;
    token: string;
  }): Promise<void> {
    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const link = `${base}/reset-password?token=${encodeURIComponent(
      args.token,
    )}`;
    const subject = 'BMP.tn — Réinitialisation de votre mot de passe';
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:#0f1419;font-family:Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#1a2332;border-radius:16px;border:1px solid #2d3a4d;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 8px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#F5A623;letter-spacing:0.05em;">BMP.tn</div>
              <div style="font-size:13px;color:#8b9cb3;margin-top:6px;">Réinitialisation du mot de passe</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px;color:#e8ecf1;font-size:15px;line-height:1.55;">
              Vous avez demandé la réinitialisation de votre mot de passe.<br/><br/>
              Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 28px;text-align:center;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F5A623,#e89410);color:#0f1419;font-weight:700;text-decoration:none;border-radius:12px;font-size:15px;">
                Réinitialiser mon mot de passe
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;color:#6b7c90;font-size:12px;line-height:1.5;">
              Si le bouton ne fonctionne pas, copiez ce lien :<br/>
              <span style="color:#F5A623;word-break:break-all;">${link}</span><br/><br/>
              Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    if (isSmtpConfigured()) {
      await sendMailViaGmailSmtp({ to: args.to, subject, html });
      return;
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'E-mail sortant non configuré : définissez MAIL_HOST, MAIL_USER, MAIL_PASS et MAIL_FROM dans backend/.env en production.',
      );
    }
    if (process.env.USE_ETHEREAL_IN_DEV?.trim() === 'true') {
      await this.sendViaEthereal(args.to, html, subject);
      return;
    }
    throw new Error(
      'E-mail sortant non configuré : MAIL_HOST/MAIL_USER/MAIL_PASS/MAIL_FROM, ou USE_ETHEREAL_IN_DEV=true en dev.',
    );
  }

  private async sendViaEthereal(
    to: string,
    html: string,
    subject: string,
  ): Promise<SendVerificationResult> {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"BMP.tn (dev)" <${testAccount.user}>`,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    const preview =
      typeof previewUrl === 'string' && previewUrl.startsWith('http')
        ? previewUrl
        : undefined;
    this.logger.warn(
      `[DEV] E-mail simulé via Ethereal (aucune livraison Gmail). Prévisualiser : ${preview ?? '(indisponible)'}`,
    );

    return {
      etherealPreviewUrl: preview,
      usedEthereal: true,
    };
  }

  private buildVerificationHtml(args: { nom: string; token: string }): string {
    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const link = `${base}/verify-email?token=${encodeURIComponent(args.token)}`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:#0f1419;font-family:Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f1419;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#1a2332;border-radius:16px;border:1px solid #2d3a4d;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 8px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#F5A623;letter-spacing:0.05em;">BMP.tn</div>
              <div style="font-size:13px;color:#8b9cb3;margin-top:6px;">Vérification de votre compte</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px;color:#e8ecf1;font-size:15px;line-height:1.55;">
              Bonjour ${this.escapeHtml(args.nom || '')},<br/><br/>
              Merci de vous être inscrit sur <strong style="color:#F5A623;">BMP.tn</strong>.
              Confirmez votre adresse e-mail pour activer votre compte.
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 28px;text-align:center;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#F5A623,#e89410);color:#0f1419;font-weight:700;text-decoration:none;border-radius:12px;font-size:15px;">
                Confirmer mon email
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;color:#6b7c90;font-size:12px;line-height:1.5;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
              <span style="color:#F5A623;word-break:break-all;">${link}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
