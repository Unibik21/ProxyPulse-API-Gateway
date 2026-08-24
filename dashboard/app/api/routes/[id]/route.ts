import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const route = await getOwnedRoute(id, session.orgId);
  if (!route) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(route);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedRoute(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // If changing service, verify it belongs to the same org
  if (body.serviceId) {
    const svc = await prisma.service.findFirst({
      where: { id: body.serviceId, orgId: session.orgId },
    });
    if (!svc) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const route = await prisma.route.update({
    where: { id },
    data:  {
      ...(body.path      !== undefined && { path:      body.path }),
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedRoute(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.route.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
