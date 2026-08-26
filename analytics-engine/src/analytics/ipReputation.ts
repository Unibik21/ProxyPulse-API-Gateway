import {redis} from '../redis.js';
import type{ LogEntry } from '../types.js';
import { config } from '../config.js';

export async function recordIpHit(entry: LogEntry){
    if (!entry.orgId || !entry.projectId) return;
    const key = `analytics:${entry.orgId}:${entry.projectId}:ip:${entry.ip}`;
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, config.ipSpamWindowSec);
    await pipeline.exec();
}

export type IpReputationEntry = {
    ip:string;
    requestCount:number;
    suspicious:boolean;
};

export async function computeIpReputation(orgId: string, projectId: string): Promise<IpReputationEntry[]> {
    const prefix = `analytics:${orgId}:${projectId}:ip:`;
    const keys = await redis.keys(`${prefix}*`);
    const results: IpReputationEntry[] = [];

    for( const key of keys){
        const ip = key.replace(prefix,'');
        const countRaw = await redis.get(key);
        const requestCount = Number(countRaw) || 0;
        results.push({ip, requestCount, suspicious:requestCount >= config.ipSpamThreshold});
    } 

    return results.sort((a,b)=> b.requestCount - a.requestCount);
}