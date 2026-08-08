import {NextRequest,NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma';

export async function GET() {
    const services = await prisma.service.findMany({include: {routes:true}})
    return NextResponse.json(services);
}

export async function POST(req: NextRequest){
    const body = await req.json();
    if(!body.name || !body.baseUrl){
        return NextResponse.json({error:'name and baseUrl required'},{status:400});
    }

    const service  = await prisma.service.create({
        data:{name:body.name, baseUrl:body.baseUrl},
    });

    return NextResponse.json(service,{status:201});
}