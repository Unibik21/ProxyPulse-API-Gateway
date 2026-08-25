import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForUser } from '@/lib/oauth';
import { signToken } from '@/lib/auth-utils';

// GET /api/auth/oauth/<provider>/callback
// The OAuth provider redirects here with ?code=...&state=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  const storedState = req.cookies.get('oauth_state')?.value;
  const savedNext = req.cookies.get('oauth_next')?.value ?? '/';

  const loginErrorUrl = new URL('/login', req.nextUrl.origin);

  const fail = (reason: string) => {
    loginErrorUrl.searchParams.set('error', reason);
    return NextResponse.redirect(loginErrorUrl);
  };

  if (!code || !state || !storedState || state !== storedState) {
    return fail('Invalid OAuth state — please try again');
  }

  const baseUrl = process.env.AUTH_BASE_URL ?? req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

  const userInfo = await exchangeCodeForUser(provider, code, redirectUri);
  if (!userInfo) {
    return fail(`Could not retrieve your ${provider} account`);
  }

  // Find the linked OAuth account, or an admin with the same email
  const existingLink = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider,
        providerId: userInfo.providerId,
      },
    },
    include: { admin: { include: { org: true } } },
  });

  let admin = existingLink?.admin ?? null;

  if (!admin) {
    admin = await prisma.admin.findUnique({
      where: { email: userInfo.email },
      include: { org: true },
    });

    if (!admin) {
      return fail(
        'No account exists for this email. Sign up first, or use email/password.'
      );
    }

    // Link this OAuth identity to the existing admin account
    await prisma.oAuthAccount.create({
      data: {
        adminId: admin.id,
        provider,
        providerId: userInfo.providerId,
        accessToken: 'redacted',
      },
    });
  }

  const token = signToken({
    adminId: admin.id,
    orgId:   admin.orgId,
    email:   admin.email,
    name:    admin.name,
  });

  const res = NextResponse.redirect(new URL(savedNext, req.nextUrl.origin));

  res.cookies.set('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });

  // Clean up OAuth cookies
  res.cookies.delete('oauth_state');
  res.cookies.delete('oauth_next');

  return res;
}
