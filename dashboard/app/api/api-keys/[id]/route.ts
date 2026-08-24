import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function getOwnedApiKey(id: string, orgId: string) {
  return prisma.apiKey.findFirst({
    where:   { id, user: { orgId } },
    include: { user: true },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedApiKey(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const key = await prisma.apiKey.update({
    where: { id },
    data:  {
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(key);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await getOwnedApiKey(id, session.orgId);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
