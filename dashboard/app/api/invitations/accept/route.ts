import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findValidInvitation } from '@/lib/invitations';
import { hashPassword, signToken } from '@/lib/auth-utils';

// GET /api/invitations/accept?token=... — public, lets the accept page
// show which org/role the invite is for.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const invitation = await findValidInvitation(token);

  if (!invitation) {
    return NextResponse.json(
      { error: 'This invitation is invalid or has expired' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    email: invitation.email,
    role:  invitation.role,
    org:   invitation.org,
  });
}

// POST /api/invitations/accept — public.
// Creates the member account with the role the admin assigned,
// marks the invitation as accepted, and logs the person in.
export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const invitation = await findValidInvitation(token);
    if (!invitation) {
      return NextResponse.json(
        { error: 'This invitation is invalid or has expired' },
        { status: 404 }
      );
    }

    const existingMember = await prisma.admin.findUnique({
      where: { email: invitation.email },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: 'An account with this email already exists — sign in instead' },
        { status: 409 }
      );
    }

    const admin = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          email:        invitation.email,
          name:         name ?? null,
          passwordHash: hashPassword(password),
          orgId:        invitation.orgId,
          role:         invitation.role, // role set by the inviting admin
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data:  { acceptedAt: new Date() },
      });
      return admin;
    });

    const tokenJwt = signToken({
      adminId: admin.id,
      orgId:   admin.orgId,
      email:   admin.email,
      name:    admin.name,
      role:    admin.role as 'admin' | 'developer',
    });

    const res = NextResponse.json({ message: 'Welcome to the organization' });

    res.cookies.set('session_token', tokenJwt, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60,
      secure:   process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (err) {
    console.error('[api/invitations/accept]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
