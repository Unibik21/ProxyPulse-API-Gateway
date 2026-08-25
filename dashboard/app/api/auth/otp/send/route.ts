import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtp } from '@/lib/otp';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return NextResponse.json(
        { error: 'No account found with that email' },
        { status: 404 }
      );
    }

    try {
      const result = await sendOtp(email);
      return NextResponse.json({
        message: result.emailSent
          ? 'OTP sent to your email address'
          : 'SMTP not configured — check server console or use the code shown below',
        expiresInMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
        // Dev-mode: the code is returned only when email could not be sent
        ...(result.devCode ? { devCode: result.devCode } : {}),
      });
    } catch (err) {
      const msg = (err as Error).message;
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.resendAvailableInSeconds !== undefined) {
          return NextResponse.json(
            {
              error: 'Please wait before requesting a new code',
              resendAvailableInSeconds: parsed.resendAvailableInSeconds,
            },
            { status: 429 }
          );
        }
      } catch { /* not a JSON error */ }
      throw err;
    }
  } catch (err) {
    console.error('[api/auth/otp/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
