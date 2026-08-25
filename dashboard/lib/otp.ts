/**
 * OTP generation, storage, and verification.
 *
 * Uses the OtpCode table (Prisma). Codes expire after OTP_TTL_MINUTES.
 * Resend is throttled to prevent brute-force.
 */

import { prisma } from './prisma';
import { randomInt } from 'crypto';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60);

/**
 * Generate a 6-digit OTP code.
 */
function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Reusable mail options for OTP delivery.
 */
function otpMailOptions(email: string, code: string) {
  const expiryText = `${OTP_TTL_MINUTES} minutes`;

  return {
    to: email,
    subject: `Your verification code: ${code}`,
    text: [
      `Hello,`,
      ``,
      `Your verification code is:`,
      ``,
      `  ${code}`,
      ``,
      `This code expires in ${expiryText}.`,
      `If you did not request this code, please ignore it.`,
    ].join('\n'),
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1a1a1a">Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code is:</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0;color:#0d9488">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:14px">
          This code expires in ${expiryText}.<br>
          If you did not request this code, please ignore it.
        </p>
      </div>
    `,
  };
}

export interface SendOtpResult {
  emailSent: boolean;
  /**
   * Only populated when the email could NOT be sent (e.g. SMTP not configured).
   * Allows the API route to surface the code to the UI in dev mode.
   */
  devCode?: string;
}

/**
 * Send an OTP to an email address (type: 'login' default).
 * Throws a JSON-stringified { resendAvailableInSeconds } error on cooldown.
 */
export async function sendOtp(email: string): Promise<SendOtpResult> {
  // Throttle: check if an unused, unexpired code was recently sent
  const recent = await prisma.otpCode.findFirst({
    where: {
      email,
      used: false,
      createdAt: { gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) },
    },
  });

  if (recent) {
    const ageSeconds = Math.round((Date.now() - recent.createdAt.getTime()) / 1000);
    const remaining = Math.max(0, OTP_RESEND_COOLDOWN_SECONDS - ageSeconds);
    throw new Error(JSON.stringify({ resendAvailableInSeconds: remaining }));
  }

  // Purge any expired codes for this email
  await prisma.otpCode.deleteMany({
    where: {
      email,
      expiresAt: { lt: new Date() },
    },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { email, code, expiresAt, purpose: 'login' },
  });

  try {
    const { sendMail } = await import('./mailer');
    await sendMail(otpMailOptions(email, code));
    return { emailSent: true };
  } catch (err) {
    console.log(`\n[OTP] Email sending failed (${(err as Error).message}).`);
    console.log(`[OTP] Login code for ${email}: ${code}\n`);
    // Return the code so the API route can show it in the UI during development
    return { emailSent: false, devCode: code };
  }
}

/**
 * Verify an OTP for an email address.
 * Consumes the code on success (marks it used).
 */
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const record = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return false;

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return true;
}

/**
 * Generate and attempt to email a *registration* OTP.
 * Returns { emailSent, devCode } so the API can surface the code in dev mode.
 */
export async function generateOtpForRegistration(
  email: string
): Promise<SendOtpResult> {
  // Purge old codes
  await prisma.otpCode.deleteMany({ where: { email } });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { email, code, expiresAt, purpose: 'register' },
  });

  try {
    const { sendMail } = await import('./mailer');
    await sendMail(otpMailOptions(email, code));
    return { emailSent: true };
  } catch (err) {
    console.log(`\n[OTP] Email sending failed (${(err as Error).message}).`);
    console.log(`[OTP] Registration code for ${email}: ${code}\n`);
    return { emailSent: false, devCode: code };
  }
}
