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

    if (!admin) {
      // No account — maybe there's a pending invitation for this email
      const invitation = await prisma.invitation.findFirst({
        where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
      });
      if (invitation) {
        return NextResponse.json(
          {
            error: 'You have a pending invitation — use the link in your invite email to set a password',
            hasInvitation: true,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, admin.passwordHash)) {
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
      role:    admin.role as 'admin' | 'developer',
    });

    const res = NextResponse.json({
      message: 'Logged in',
      role:    admin.role,
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
