import { cookies } from 'next/headers';
import { verifyToken, type SessionPayload } from './auth-utils';

/**
 * Returns the verified session payload for the current request,
 * or null if the user is unauthenticated / token is invalid.
 *
 * Use this in API route handlers (Node.js runtime).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
