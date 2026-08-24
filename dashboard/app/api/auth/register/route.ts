import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth-utils';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { orgName, adminName, email, password } = await req.json();

    if (!orgName || !email || !password) {
      return NextResponse.json(
        { error: 'orgName, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check for existing org or admin email
    const slug = slugify(orgName);
    const [existingOrg, existingAdmin] = await Promise.all([
      prisma.organization.findFirst({ where: { OR: [{ name: orgName }, { slug }] } }),
      prisma.admin.findUnique({ where: { email } }),
    ]);

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with that name already exists' },
        { status: 409 }
      );
    }
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An account with that email already exists' },
        { status: 409 }
      );
    }

    // Create org + admin in a transaction
    const { org, admin } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug },
      });
      const admin = await tx.admin.create({
        data: {
          email,
          name:         adminName ?? null,
          passwordHash: hashPassword(password),
          orgId:        org.id,
        },
      });
      return { org, admin };
    });

    const token = signToken({
      adminId: admin.id,
      orgId:   org.id,
      email:   admin.email,
      name:    admin.name,
    });

    const res = NextResponse.json(
      { message: 'Organization created', orgName: org.name },
      { status: 201 }
    );

    res.cookies.set('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 60 * 60, // 7 days
      secure:   process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
