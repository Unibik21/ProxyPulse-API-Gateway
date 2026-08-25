import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtpForRegistration } from '@/lib/otp';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An account with that email already exists' },
        { status: 409 }
      );
    }

    const result = await generateOtpForRegistration(email);

    return NextResponse.json({
      message: result.emailSent
        ? 'Verification code sent to your email'
        : 'SMTP not configured — see the code below (dev mode)',
      expiresInMinutes: OTP_TTL_MINUTES,
      // Dev-mode: surface the code only when email could not be sent
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (err) {
    console.error('[api/auth/otp/register-send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
