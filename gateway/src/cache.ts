import {redis} from './redis.js';
import type { FastifyRequest } from 'fastify';

function cacheKey(req: FastifyRequest):string{
    return `response_cache:${req.method}:${req.url}`;
}

export async function getCachedResponse(req: FastifyRequest){
    if(req.method!=='GET') return null;
    const cached = await redis.get(cacheKey(req));
    if(!cached)return null;
    return JSON.parse(cached) as {status:number; headers:Record<string,string>; body : string};

}

export async function setCachedResponse(
    req:FastifyRequest,
    status:number,
    header: Record<string,string>,
    body:string,
    ttlSeconds: number
){
    if(req.method!=='GET')return;
    if(status>=400)return;
    await redis.set(cacheKey(req),JSON.stringify({status,header,body}),'EX',ttlSeconds);
}

export async function purgeRouteCache(path:string){
    const keys = await redis.keys(`response_cache:*:${path}*`);
    if(keys.length)await redis.del(...keys);
}
