import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const routes = await prisma.route.findMany({
    where:   { service: { orgId: session.orgId } },
    include: { service: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.path || !body.serviceId) {
    return NextResponse.json(
      { error: 'path and serviceId are required' },
      { status: 400 }
    );
  }

  // Ensure the service belongs to this org
  const service = await prisma.service.findFirst({
    where: { id: body.serviceId, orgId: session.orgId },
  });
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const route = await prisma.route.create({
    data: {
      path:      body.path,
      service:   { connect: { id: body.serviceId } },
      rateLimit: body.rateLimit ?? null,
      cacheTtl:  body.cacheTtl  ?? null,
    },
    include: { service: true },
  });

  return NextResponse.json(route, { status: 201 });
}
