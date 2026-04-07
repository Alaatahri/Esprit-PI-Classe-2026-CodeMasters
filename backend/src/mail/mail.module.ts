import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { getSmtpCredentials } from './smtp-env';

function buildMailerOptions() {
  const creds = getSmtpCredentials();
  const host =
    creds?.host ?? (process.env.MAIL_HOST?.trim() || 'smtp.gmail.com');
  const port = Number(process.env.MAIL_PORT) || 587;
  const secure =
    process.env.MAIL_SECURE === 'true' || port === 465;
  const user = creds?.user ?? process.env.MAIL_USER?.trim() ?? '';
  const pass = creds?.pass ?? '';

  return {
    transport: {
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      /** Gmail / la plupart des SMTP en 587 : STARTTLS obligatoire */
      ...(secure ? {} : { requireTLS: true }),
      tls: {
        rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    },
    defaults: {
      from: `"BMP.tn" <${user || 'noreply@bmp.tn'}>`,
    },
  };
}

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => buildMailerOptions(),
    }),
  ],
  providers: [MailService],
  exports: [MailService, MailerModule],
})
export class MailModule {}
