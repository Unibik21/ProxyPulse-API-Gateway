import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyOtp } from '@/lib/otp';
import { signToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const otpValid = await verifyOtp(email, otp);

    if (!otpValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // OTP is valid — check if an admin account exists with this email
    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!admin) {
      // Tell the client this email isn't registered yet.
      // The login page will redirect to /register to complete signup.
      return NextResponse.json(
        {
          error: 'No account found with that email',
          needsRegistration: true,
          email,
        },
        { status: 404 }
      );
    }

    const token = signToken({
      adminId: admin.id,
      orgId:   admin.orgId,
      email:   admin.email,
      name:    admin.name,
    });

    const res = NextResponse.json({
      message: 'Logged in',
      org:     { id: admin.org.id, name: admin.org.name, slug: admin.org.slug },
    });

    res.cookies.set('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60,
      secure:   process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (err) {
    console.error('[api/auth/otp/verify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
