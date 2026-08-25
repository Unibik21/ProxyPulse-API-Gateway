import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMember } from '@/lib/permissions';

// GET /api/members — list all organization members (any member may view)
export async function GET() {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const members = await prisma.admin.findMany({
    where: { orgId: guard.session.orgId },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(members);
}
