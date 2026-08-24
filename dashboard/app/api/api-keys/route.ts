import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where:   { user: { orgId: session.orgId } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  // Strip the stored hash — never expose it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sanitized = keys.map(({ key: _key, ...rest }) => rest);
  return NextResponse.json(sanitized);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify the user belongs to this org
    const user = await prisma.user.findFirst({
      where: { id: userId, orgId: session.orgId },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawKey    = `gk_${randomBytes(24).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    await prisma.apiKey.create({
      data: { key: hashedKey, user: { connect: { id: userId } } },
    });

    return NextResponse.json({ apiKey: rawKey }, { status: 201 });
  } catch (err) {
    console.error('[api-keys POST]', err);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}
