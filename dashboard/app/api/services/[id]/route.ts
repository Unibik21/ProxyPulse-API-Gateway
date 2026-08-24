import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function getOwnedService(id: string, orgId: string) {
  return prisma.service.findFirst({
    where:   { id, orgId },
    include: { routes: true },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const service = await getOwnedService(id, session.orgId);
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(service);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedService(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const service = await prisma.service.update({
    where: { id },
    data:  {
      ...(body.name    !== undefined && { name:    body.name }),
      ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl }),
      ...(body.healthy !== undefined && { healthy: body.healthy }),
    },
    include: { routes: true },
  });

  return NextResponse.json(service);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedService(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
