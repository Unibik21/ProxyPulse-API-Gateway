import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      include: { org: true },
    });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      // Same error for both cases to prevent email enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
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
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
