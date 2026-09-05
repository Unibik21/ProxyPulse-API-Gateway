import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    const routes = await prisma.route.findMany({
        include : {service:true},
    });

    const config = routes.map((r: (typeof routes)[number]) => ({
        path : r.path,
        method: r.method,
        serviceName : r.service.name,
        baseUrl : r.service.baseUrl,
        active: r.active,
        rateLimit : r.rateLimit,
        cacheTtl: r.cacheTtl,
        orgId: r.service.orgId,
        projectId: r.service.projectId,
    }));

    return NextResponse.json({routes:config});
}
