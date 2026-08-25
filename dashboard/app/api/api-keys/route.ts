import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const { label, userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const existingKey = await prisma.apiKey.findFirst({
    where: { userId },
  });
  if (userFromExistingKey) {
    return NextResponse.json(
      { error: 'An API key with this user already exists' }, { status: 409 }
    );
  }

  const rawKey = `gk_${Math.random().toString(36).substring(2, 18)}`;
  const hashedKey = require('crypto').createHash('sha256').update(rawKey).digest('hex');

  const key = await prisma.apiKey.create({
    data: {
      key: hashedKey,
      label: label || `key-${Date.now()}`,
      user: { connect: { id: userIdToUse }},

    return NextResponse.json({ apiKey: rawKey, label }, { status: 201 });
  } catch (err) {
    console.error('[api-keys POST]', err);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}