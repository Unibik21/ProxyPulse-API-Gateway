/**
 * Role-based access control for API routes.
 *
 * Role hierarchy (higher number = more permissions):
 *   developer → can view everything + manage services/routes/projects
 *   admin     → everything, plus members, invitations, API keys, org settings
 *
 * Usage:
 *   const guard = await requireRole('developer'); // any member
 *   if (guard.error) return guard.error;
 *   const session = guard.session;
 */

import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { getSession } from './session';
import type { OrgRole, SessionPayload } from './auth-utils';

const ROLE_LEVEL: Record<OrgRole, number> = {
  developer: 1,
  admin:     2,
};

export function roleAtLeast(role: OrgRole, min: OrgRole): boolean {
  return (ROLE_LEVEL[role] ?? 0) >= (ROLE_LEVEL[min] ?? 0);
}

export async function requireRole(
  minRole: OrgRole
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!roleAtLeast(session.role, minRole)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden — insufficient role', requiredRole: minRole },
        { status: 403 }
      ),
    };
  }

  return { session };
}

/** Any logged-in organization member. */
export async function requireMember() {
  return requireRole('developer');
}

/** Admin-only capability (members, invitations, API keys, org settings). */
export async function requireAdmin() {
  return requireRole('admin');
}

/** Check that an organization member can access a specific project. */
export async function canAccessProject(projectId: string, session: SessionPayload) {
  if (session.role === 'admin') {
    return Boolean(await prisma.project.findFirst({ where: { id: projectId, orgId: session.orgId }, select: { id: true } }));
  }

  return Boolean(await prisma.projectMember.findFirst({
    where: { projectId, adminId: session.adminId, project: { orgId: session.orgId } },
    select: { projectId: true },
  }));
}

export async function requireProjectAccess(projectId: string) {
  const guard = await requireMember();
  if ('error' in guard) return guard;
  if (!await canAccessProject(projectId, guard.session)) {
    return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) };
  }
  return guard;
}
