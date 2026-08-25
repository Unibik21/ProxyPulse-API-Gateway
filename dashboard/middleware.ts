import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Paths that never need a session ─────────────────────────────────
// Auth UI + auth API endpoints
const PUBLIC_PREFIXES = ['/login', '/register', '/verify-otp', '/api/auth/'];

// Polled by the gateway process itself (machine-to-machine, no cookie)
const GATEWAY_EXACT = new Set(['/api/config', '/api/api-keys/active']);

// ── Edge-runtime JWT verification (Web Crypto API) ───────────────────

function b64urlDecode(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad  = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw  = atob(b64 + pad);
  const buf  = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, body, sig] = parts;

    const secret = process.env.AUTH_SECRET ?? 'dev-secret-change-me-in-production';

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const sigBytes  = b64urlDecode(sig);
    const dataBytes = new TextEncoder().encode(`${header}.${body}`);

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
    if (!valid) return false;

    // Check expiry without Buffer (not available in Edge)
    const payloadJson = new TextDecoder().decode(b64urlDecode(body));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

// ── Middleware ───────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — always pass through
  if (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Gateway-polled endpoints — no session required
  if (GATEWAY_EXACT.has(pathname)) {
    return NextResponse.next();
  }

  // Auth pages / auth API — no session required
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Everything else needs a valid session
  const token   = request.cookies.get('session_token')?.value;
  const authed  = token ? await isValidToken(token) : false;

  if (!authed) {
    // API requests → 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page requests → redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
