import {redis} from './redis.js';

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 100;

export async function checkRateLimit(
    userId:string,
    routePath:string,
    limit: number = DEFAULT_LIMIT
): Promise<{ allowed : boolean; remaining:number}>{

    const key = `ratelimit:${userId}:${routePath}`;
    const now = Date.now();
    const windowStart = now-WINDOW_MS;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key,0,windowStart);
    pipeline.zadd(key,now,`${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key,Math.ceil(WINDOW_MS/1000));

    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number;

    return {
        allowed : count<=limit,
        remaining: Math.max(0,limit-count),
    };
}