import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const keys = await prisma.apiKey.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  
  // Remove sensitive key hash from response
  const sanitizedKeys = keys.map(({ key, ...rest }) => rest);
  return NextResponse.json(sanitizedKeys);
}

export async function POST(req: NextRequest) {
  try{  
    const {userId} = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    const rawKey = `gk_${randomBytes(24).toString("hex")}`;
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");

    await prisma.apiKey.create({
        data: {key:hashedKey, userId},
    });

    return NextResponse.json({apiKey:rawKey}, {status:201});
  }
  catch (error) {
    console.error("Failed to create API key:", error);

    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}


