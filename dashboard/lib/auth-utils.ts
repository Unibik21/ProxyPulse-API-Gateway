/**
 * Auth utilities — uses only Node.js built-in `crypto`.
 * (API routes run in the Node.js runtime, so this is fine.)
 *
 * For Edge-runtime signature verification (middleware) see the inline
 * Web Crypto implementation in middleware.ts.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-me-in-production';
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  adminId: string;
  orgId:   string;
  email:   string;
  name:    string | null;
  exp:     number;
  iat:     number;
}

// ── JWT (minimal HS256) ──────────────────────────────────────────────

const HEADER_B64 = Buffer.from(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' })
).toString('base64url');

export function signToken(payload: Omit<SessionPayload, 'exp' | 'iat'>): string {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: now, exp: now + TTL_SECONDS })
  ).toString('base64url');

  const sig = createHmac('sha256', SECRET)
    .update(`${HEADER_B64}.${body}`)
    .digest('base64url');

  return `${HEADER_B64}.${body}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;

    const expected = createHmac('sha256', SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    // constant-time comparison
    const sigBuf      = Buffer.from(sig, 'base64url');
    const expectedBuf = Buffer.from(expected, 'base64url');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    );

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Password (scrypt + salt) ─────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    const inputHash = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(hash,      'hex')
    );
  } catch {
    return false;
  }
}
