import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizeUrl } from '@/lib/oauth';

// GET /api/auth/oauth/<provider>/start
// Redirects the browser to the provider's authorization page,
// or back to /login with an error if the provider isn't configured.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const baseUrl = process.env.AUTH_BASE_URL ?? req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

  const result = buildAuthorizeUrl(provider, redirectUri);

  if (!result) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set(
      'error',
      `${provider} sign-in is not configured. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in .env and restart the dashboard.`
    );
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.redirect(result.url);

  // Store state in a short-lived httpOnly cookie for CSRF protection
  res.cookies.set('oauth_state', result.state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
    secure: process.env.NODE_ENV === 'production',
  });

  // Remember where to send the user after login
  const next = req.nextUrl.searchParams.get('next');
  if (next) {
    res.cookies.set('oauth_next', next, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return res;
}
