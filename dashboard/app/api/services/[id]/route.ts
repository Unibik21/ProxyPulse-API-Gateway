import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMember, canAccessProject } from '@/lib/permissions';

async function getOwnedService(id: string, orgId: string) {
  return prisma.service.findFirst({
    where:   { id, orgId },
    include: { routes: true, project: { select: { id: true, name: true } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const service = await getOwnedService(id, guard.session.orgId);
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (service.projectId && !await canAccessProject(service.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(service);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const existing = await getOwnedService(id, guard.session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.projectId && !await canAccessProject(existing.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Optional project reassignment — must belong to the same org
  if (body.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, orgId: guard.session.orgId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  }

  const service = await prisma.service.update({
    where: { id },
    data:  {
      ...(body.name      !== undefined && { name:      body.name }),
      ...(body.baseUrl   !== undefined && { baseUrl:   body.baseUrl }),
      ...(body.healthy   !== undefined && { healthy:   body.healthy }),
      ...(body.projectId !== undefined && { projectId: body.projectId ?? null }),
    },
    include: { routes: true, project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireMember();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const existing = await getOwnedService(id, guard.session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.projectId && !await canAccessProject(existing.projectId, guard.session)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
