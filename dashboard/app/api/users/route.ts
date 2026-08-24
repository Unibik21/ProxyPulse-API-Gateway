import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    where:   { orgId: session.orgId },
    include: { apiKeys: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.email || !body.name) {
    return NextResponse.json({ error: 'email and name are required' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name:  body.name,
      orgId: session.orgId,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
