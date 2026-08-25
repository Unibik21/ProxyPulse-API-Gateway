import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { hashPassword } from '@/lib/auth-utils';

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, password }
 *
 * Requires a valid OTP previously sent via /api/auth/otp/send
 * (the OTP is consumed on success, so it can't be reused).
 */
export async function POST(req: NextRequest) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      // Same error as bad OTP — don't reveal which emails are registered
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    const valid = await verifyOtp(email, otp);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    await prisma.admin.update({
      where: { email },
      data: { passwordHash: hashPassword(password) },
    });

    return NextResponse.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    console.error('[api/auth/reset-password]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
