import {redis} from '../redis.js';
import type { LogEntry } from '../types.js';


export async function recordCacheEvent(entry: LogEntry){

    if(entry.cacheStatus=== 'N/A'){
        await redis.hincrby(
            'analytics:cache_uncached_traffic',
            entry.path,
            1
        );
        return;
    }

    const field = entry.cacheStatus=== 'HIT'? 'hits':'misses';
    await redis.hincrby(`analytics:cache_status:${entry.path}`,field,1);
}


export type CacheRecommendation = {
    path : string;
    reason : 'high_traffic_uncached' | 'low_hit_rate';
    detail: string;
}

const HIGH_TRAFFIC_THRESHOLD = 50;
const LOW_HIT_RATE_THRESHOLD = 0.3;


export async function computeCacheRecommendations(): Promise<CacheRecommendation[]>{
    const recommendations: CacheRecommendation[]= [];

    const uncached = await redis.hgetall('analytics:cache_uncached_traffic');
    for(const [path,countStr] of Object.entries(uncached)){
        const count = Number(countStr);
        if(count>=HIGH_TRAFFIC_THRESHOLD){
            recommendations.push({
                path,
                reason:'high_traffic_uncached',
                detail:`${count} requests with no cache configured — consider enabling caching for this route.`,
            });
        }
    }

    const statKeys = await redis.keys('analytics:cache_stats:*');
    for(const key of statKeys){
        const path = key.replace('analytics:cache_stats:','');
        const stats = await redis.hgetall(key);
        const hits = Number(stats.hits || 0);
        const misses = Number(stats.misses || 0);
        const total = hits+misses;
        if(total>=HIGH_TRAFFIC_THRESHOLD){
            const hitRate = hits/total;
            if(hitRate<LOW_HIT_RATE_THRESHOLD){
                recommendations.push({
                    path,
                    reason: 'low_hit_rate',
                    detail: `Hit rate is ${(hitRate * 100).toFixed(1)}% over ${total} requests — TTL may be too short, or this route isn't a good caching candidate.`,
                });
            }
        } 
    }

    return recommendations;
}

