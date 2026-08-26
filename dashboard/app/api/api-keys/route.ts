import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const keys = await prisma.apiKey.findMany({
    where: { user: { orgId: guard.session.orgId } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;

  const { label, userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const member = await prisma.admin.findFirst({
    where: { id: userId, orgId: guard.session.orgId },
  });

  let apiKeyUserId = userId;
  if (member) {
    const existingUser = await prisma.user.findFirst({
      where: { email: member.email, orgId: guard.session.orgId },
    });
    const apiKeyUser = existingUser ?? await prisma.user.create({
      data: {
        email: member.email,
        name: member.name,
        orgId: guard.session.orgId,
      },
    });
    apiKeyUserId = apiKeyUser.id;
  } else {
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId: guard.session.orgId },
    });
    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
  }

  const rawKey = `gk_${Math.random().toString(36).substring(2, 18)}`;
  const hashedKey = createHash('sha256').update(rawKey).digest('hex');

  try {
    await prisma.apiKey.create({
      data: {
        key: hashedKey,
        label: label || `key-${Date.now()}`,
        user: { connect: { id: apiKeyUserId } },
      },
    });

    return NextResponse.json({ apiKey: rawKey, label }, { status: 201 });
  } catch (err: unknown) {
    console.error('[api-keys POST]', err);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}