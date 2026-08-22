import {redis} from '../redis.js';
import type{ LogEntry } from '../types.js';
import { config } from '../config.js';

export async function recordIpHit(entry: LogEntry){
    const key = `analytics:ip_hits:${entry.ip}`;
    const pipeline = redis.pipline();
    pipeline.incr(key);
    pipeline.expire(key, config.isSpamWindowSec);
    await pipeline.exec();
}

export type IpReputationEntry = {
    ip:string;
    requestCount:number;
    suspicious:boolean;
};

export async function computeReputation(): Promise<IpReputationEntry[]> {
    const keys = await redis.keys('analytics:ip_hits:*');
    const results: IpReputationEntry[] = [];

    for( const key of keys){
        const ip = key.replace('analytics:ip_hits:','');
        const countRaw = await redis.get(key);
        const requestCount = Number(countRaw) || 0;
        results.push({ip, requestCount, suspicious:requestCount >= config.ipSpamThreshold});
    } 

    return results.sort((a,b)=> b.requestCount - a.requestCount);
}