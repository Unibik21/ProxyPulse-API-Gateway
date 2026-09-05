import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMember, canAccessProject } from '@/lib/permissions';

export async function GET() {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const routes = await prisma.route.findMany({
    where: guard.session.role === 'admin'
      ? { service: { orgId: guard.session.orgId } }
      : { service: { orgId: guard.session.orgId, project: { members: { some: { adminId: guard.session.adminId } } } } },
    include: { service: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  // developer-or-above can add services/routes per the access matrix
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const body = await req.json();
  if (!body.path || !body.serviceId) {
    return NextResponse.json(
      { error: 'path and serviceId are required' }, { status: 400 }
    );
  }
  const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(body.method)
    ? body.method
    : 'GET';

  // Ensure the service belongs to this org
  const service = await prisma.service.findFirst({
    where: { id: body.serviceId, orgId: guard.session.orgId },
  });
  if (!service || (service.projectId && !await canAccessProject(service.projectId, guard.session))) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const route = await prisma.route.create({
    data: {
      path:      body.path,
      method,
      service:   { connect: { id: body.serviceId } },
      active:    body.active ?? true,
      rateLimit: body.rateLimit ?? null,
      cacheTtl:  body.cacheTtl  ?? null,
    },
    include: { service: true },
  });

  return NextResponse.json(route, { status: 201 });
}