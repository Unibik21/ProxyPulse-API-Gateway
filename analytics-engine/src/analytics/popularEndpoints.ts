import { redis } from '../redis.js';
import type { LogEntry } from '../types.js';

const HITS_KEY = 'analytics:endpoint_hits'; // sorted set: member = path, score = hit count

export async function recordEndpointHit(entry: LogEntry) {
  await redis.zincrby(HITS_KEY, 1, entry.path);
}

export type EndpointPopularity = { path: string; hits: number };

export async function computeMostVisited(limit = 10): Promise<EndpointPopularity[]> {
  const raw = await redis.zrange(HITS_KEY, 0, limit - 1, 'REV', 'WITHSCORES');
  const results: EndpointPopularity[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    results.push({ path: raw[i], hits: Number(raw[i + 1]) });
  }
  return results;
}