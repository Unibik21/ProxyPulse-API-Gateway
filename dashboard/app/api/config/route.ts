import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    const routes = await prisma.route.findMany({
        include : {service:true},
    });

    const config = routes.map((r: (typeof routes)[number]) => ({
        path : r.path,
        serviceName : r.service.name,
        baseUrl : r.service.baseUrl,
        ratelimit : r.rateLimit,
    }));

    return NextResponse.json({routes:config});
}