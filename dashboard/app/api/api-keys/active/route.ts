import { NextResponse } from "next/server";
import {prisma} from '@/lib/prisma';

export async function GET(){
    const keys = await prisma.apiKey.findMany({
        where: {active:true},
        select: {key: true,userId :true, expiresAt:true},
    });

    return NextResponse.json({keys});
}

