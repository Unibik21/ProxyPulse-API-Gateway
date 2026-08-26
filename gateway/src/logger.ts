import { redis } from './redis.js'

export type LogEntry = {
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    service: string | null;
    userId: string | null;
    ip: string; 
    cacheStatus: 'HIT' | 'MISS' | 'N/A';
    orgId: string | null;
    projectId: string | null;
};

const LOG_QUEUE_KEY = 'log_queue';
const MAX_QUEUE_LENGTH = 100_000;

export async function pushLog(entry: LogEntry) {
    try {
        await redis.lpush(LOG_QUEUE_KEY, JSON.stringify(entry));
        await redis.ltrim(LOG_QUEUE_KEY, 0, MAX_QUEUE_LENGTH - 1);
    } catch (err) {
        console.error('Failed to push log entry: ', err);
    }
}