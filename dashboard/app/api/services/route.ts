import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMember, canAccessProject } from '@/lib/permissions';

export async function GET() {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const services = await prisma.service.findMany({
    where: guard.session.role === 'admin'
      ? { orgId: guard.session.orgId }
      : { orgId: guard.session.orgId, project: { members: { some: { adminId: guard.session.adminId } } } },
    include: { routes: true, project: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  // developer-or-above can create services/routes per the access matrix
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  if (!body.name || !body.baseUrl) {
    return NextResponse.json({ error: 'name and baseUrl required' }, { status: 400 });
  }

  // Optional project assignment — must belong to the same org
  if (body.projectId) {
    if (!await canAccessProject(body.projectId, guard.session)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  }

  const service = await prisma.service.create({
    data: {
      name: body.name,
      baseUrl: body.baseUrl,
      orgId: guard.session.orgId,
      ...(body.projectId ? { projectId: body.projectId } : {}),
    },
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service, { status: 201 });
}
