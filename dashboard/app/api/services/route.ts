import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const services = await prisma.service.findMany({
    where:   { orgId: session.orgId },
    include: { routes: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.baseUrl) {
    return NextResponse.json({ error: 'name and baseUrl required' }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: { name: body.name, baseUrl: body.baseUrl, orgId: session.orgId },
  });

  return NextResponse.json(service, { status: 201 });
}
