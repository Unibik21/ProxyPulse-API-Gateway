import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({
    adminId: session.adminId,
    email:   session.email,
    name:    session.name,
    role:    session.role,
    org,
  });
}
