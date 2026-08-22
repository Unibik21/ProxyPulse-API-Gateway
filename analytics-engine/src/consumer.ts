import { blockingRedis } from './redis.js';
import type{ LogEntry } from './types.js';
import { recordLatency } from './analytics/latency.js';
import { recordIpHit } from './analytics/ipReputation.js';
import { recordEndpointHit } from './analytics/popularEndpoints.js';
import { recordCacheEvent } from './analytics/cacheRecommendations.js';

const LOG_QUEUE_KEY = 'log_queue';

export async function startConsumer(){
    console.log('Analytics engine: consumer started, draining log_queue...');
    while(true){
        try{
            const result = await blockingRedis.brpop(LOG_QUEUE_KEY,5);
            if(!result) continue;
            const [,raw]= result;
            const entry: LogEntry = JSON.parse(raw);
            await processEntry(entry);
        }
        catch(err){
            console.error('Consumer error:', err);
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}

async function processEntry(entry: LogEntry){
    await Promise.all([
        recordLatency(entry),
        recordIpHit(entry),
        recordEndpointHit(entry),
        recordCacheEvent(entry),
    ]);
}
