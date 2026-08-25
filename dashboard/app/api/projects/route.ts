import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { orgId: session.orgId },
    include: { _count: { select: { services: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const existing = await prisma.project.findFirst({
    where: { name, orgId: session.orgId },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'A project with that name already exists' }, { status: 409 }
    );
  }

  const project = await prisma.project.create({
    data: { name, description: description ?? null, orgId: session.orgId },
    include: { _count: { select: { services: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}