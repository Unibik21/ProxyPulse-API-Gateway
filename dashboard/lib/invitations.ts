/**
 * Organization invitation helpers.
 *
 * Flow:
 *  1. Admin calls POST /api/invitations with { email, role }
 *  2. An invitation row with a random token is created (7-day expiry)
 *  3. The invitee receives an email with /accept-invite?token=...
 *     (when SMTP isn't configured the API returns the link in dev mode)
 *  4. The invitee opens the link, sets a password, and the account is
 *     created with the role the admin assigned. No org choice — the
 *     invitation itself carries the org.
 */

import { randomBytes } from 'crypto';
import { prisma } from './prisma';

export const INVITE_TTL_DAYS = 7;

export async function createInvitation(params: {
  email: string;
  role: 'developer';
  orgId: string;
  invitedBy: string | null;
}) {
  const token = randomBytes(32).toString('hex');

  // Remove any existing invitation for this email/org (regardless of status)
  await prisma.invitation.deleteMany({
    where: { email: params.email, orgId: params.orgId },
  });

  return prisma.invitation.create({
    data: {
      email: params.email,
      role: params.role,
      token,
      orgId: params.orgId,
      invitedBy: params.invitedBy,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

export async function findValidInvitation(token: string) {
  if (!token) return null;
  return prisma.invitation.findFirst({
    where: {
      token,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { org: { select: { id: true, name: true, slug: true } } },
  });
}
