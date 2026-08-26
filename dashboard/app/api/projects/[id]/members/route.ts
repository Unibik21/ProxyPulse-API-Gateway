import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireProjectAccess } from '@/lib/permissions';

async function getProject(id: string, orgId: string) {
  return prisma.project.findFirst({ where: { id, orgId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireProjectAccess(id);
  if ('error' in guard) return guard.error;

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { admin: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { admin: { createdAt: 'asc' } },
  });

  return NextResponse.json(members.map((member) => member.admin));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const project = await getProject(id, guard.session.orgId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const { adminId } = await req.json();
  if (!adminId) return NextResponse.json({ error: 'adminId is required' }, { status: 400 });

  const admin = await prisma.admin.findFirst({
    where: { id: adminId, orgId: guard.session.orgId },
  });
  if (!admin) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  await prisma.projectMember.upsert({
    where: { projectId_adminId: { projectId: id, adminId } },
    create: { projectId: id, adminId },
    update: {},
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const project = await getProject(id, guard.session.orgId);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const adminId = new URL(req.url).searchParams.get('adminId');
  if (!adminId) return NextResponse.json({ error: 'adminId is required' }, { status: 400 });

  await prisma.projectMember.deleteMany({ where: { projectId: id, adminId } });
  return NextResponse.json({ success: true });
}
