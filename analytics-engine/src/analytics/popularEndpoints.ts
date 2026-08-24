import { redis } from '../redis.js';
import type { LogEntry } from '../types.js';

export async function recordEndpointHit(entry: LogEntry) {
  if (!entry.orgId) return;
  const key = `analytics:${entry.orgId}:endpoint_hits`;
  await redis.zincrby(key, 1, entry.path);
}

export type EndpointPopularity = { path: string; hits: number };

export async function computeMostVisited(orgId: string, limit = 10): Promise<EndpointPopularity[]> {
  const key = `analytics:${orgId}:endpoint_hits`;
  const raw = await redis.zrange(key, 0, limit - 1, 'REV', 'WITHSCORES');
  const results: EndpointPopularity[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    results.push({ path: raw[i], hits: Number(raw[i + 1]) });
  }
  return results;
}