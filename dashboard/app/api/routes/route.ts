import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const routes = await prisma.route.findMany({
    include: { service: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.path || !body.serviceId) {
    return NextResponse.json(
      { error: "path and serviceId are required" },
      { status: 400 }
    );
  }

  const route = await prisma.route.create({
    data: {
      path: body.path,
      serviceId: body.serviceId,
      rateLimit: body.rateLimit ?? null,
    },
    include: { service: true },
  });

  return NextResponse.json(route, { status: 201 });
}
