import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMember, canAccessProject } from '@/lib/permissions';

async function getOwnedRoute(id: string, orgId: string) {
  return prisma.route.findFirst({
    where:   { id, service: { orgId } },
    include: { service: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const route = await getOwnedRoute(id, guard.session.orgId);
  if (!route) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (route.service.projectId && !await canAccessProject(route.service.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(route);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const existing = await getOwnedRoute(id, guard.session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.service.projectId && !await canAccessProject(existing.service.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const method = body.method === undefined
    ? undefined
    : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(body.method)
      ? body.method
      : null;
  if (method === null) {
    return NextResponse.json({ error: 'Invalid HTTP method' }, { status: 400 });
  }
  if (body.serviceId) {
    const svc = await prisma.service.findFirst({
      where: { id: body.serviceId, orgId: guard.session.orgId },
    });
    if (!svc) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const route = await prisma.route.update({
    where: { id },
    data:  {
      ...(body.path      !== undefined && { path:      body.path }),
      ...(method            !== undefined && { method }),
      ...(body.serviceId !== undefined && { serviceId: body.serviceId }),
      ...(body.rateLimit !== undefined && { rateLimit: body.rateLimit }),
      ...(body.cacheTtl  !== undefined && { cacheTtl:  body.cacheTtl }),
    },
    include: { service: true },
  });

  return NextResponse.json(route);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const existing = await getOwnedRoute(id, guard.session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.service.projectId && !await canAccessProject(existing.service.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.route.delete({ where: { id } });
  return NextResponse.json({ success: true });
}