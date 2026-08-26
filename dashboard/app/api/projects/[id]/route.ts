import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

async function getOwnedProject(id: string, orgId: string) {
  return prisma.project.findFirst({
    where: { id, orgId },
    include: { services: true, _count: { select: { services: true } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const session = guard.session;

  const { id } = await params;
  const project = await getOwnedProject(id, session.orgId);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const session = guard.session;

  const { id } = await params;
  const existing = await getOwnedProject(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name        !== undefined && { name:        body.name }),
      ...(body.description !== undefined && { description: body.description }),
    },
    include: { _count: { select: { services: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const session = guard.session;

  const { id } = await params;
  const existing = await getOwnedProject(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}