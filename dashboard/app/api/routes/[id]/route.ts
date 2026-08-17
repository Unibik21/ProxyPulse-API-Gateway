import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const route = await prisma.route.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(route);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const route = await prisma.route.update({
    where: { id },
    data: {
      ...(body.path !== undefined && { path: body.path }),
      ...(body.serviceId !== undefined && { serviceId: body.serviceId }),
      ...(body.rateLimit !== undefined && { rateLimit: body.rateLimit }),
    },
    include: { service: true },
  });

  return NextResponse.json(route);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.route.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
