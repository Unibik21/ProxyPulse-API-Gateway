import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function POST(req: NextRequest){

    const {userId} = await req.json();

    const rawKey = `gk_${randomBytes(24).toString('hex')}`;
    const hashedKey = createHash('sha256').update(rawKey).digest('hex');

    await prisma.apiKey.create({
        data: {key:hashedKey, userId},
    });

    return NextResponse.json({apiKey:rawKey}, {status:201});
}

