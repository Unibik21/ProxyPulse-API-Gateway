/**
 * Email sending via nodemailer (SMTP).
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * For development, use Mailtrap, Mailgun, or a local SMTP server like MailHog.
 */

import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        'SMTP config missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.'
      );
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }
  return transporter;
}

/**
 * Send an email using the configured SMTP transport.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const from =
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@example.com';

  await getTransporter().sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? 'API Gateway'}" <${from}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? opts.text,
  });
}

/**
 * Verify SMTP connectivity (useful for health checks / debugging).
 */
export async function verifyMailer(): Promise<boolean> {
  try {
    await getTransporter().verify();
    return true;
  } catch (err) {
    console.error('[mailer] verify failed:', err);
    return false;
  }
}
