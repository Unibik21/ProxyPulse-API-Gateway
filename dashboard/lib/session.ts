import { cookies } from 'next/headers';
import { verifyToken, type OrgRole, type SessionPayload } from './auth-utils';
import { prisma } from './prisma';

/**
 * Returns the verified session payload for the current request,
 * or null if the user is unauthenticated / token is invalid.
 *
 * Tokens issued before roles were introduced don't contain `role` —
 * for those we look it up in the DB once so old sessions keep working.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  if (!payload.role) {
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { role: true },
    });
    if (!admin) return null;
    payload.role = admin.role as OrgRole;
  }

  return payload;
}
