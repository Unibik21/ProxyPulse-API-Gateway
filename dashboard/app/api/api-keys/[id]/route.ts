import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const key = await prisma.apiKey.update({
    where: { id },
    data: {
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(key);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
