import { redis } from "../redis.js";
import type { LogEntry } from "../types.js";

const MAX_SAMPLES = 1000; // capped rolling window per service, avoids unbounded memory

export async function recordLatency(entry: LogEntry) {
  if (!entry.service || !entry.orgId || !entry.projectId) return;
  const key = `analytics:${entry.orgId}:${entry.projectId}:latency:${entry.service}`;
  await redis.lpush(key, entry.durationMs);
  await redis.ltrim(key, 0, MAX_SAMPLES - 1);
}

export type LatencyStats = {
  service: string;
  avgMs: number;
  p95Ms: number;
  sampleCount: number;
};

export async function computeLatencyStats(orgId: string, projectId: string): Promise<LatencyStats[]> {
  const prefix = `analytics:${orgId}:${projectId}:latency:`;
  const keys = await redis.keys(`${prefix}*`);
  const results: LatencyStats[] = [];

  for (const key of keys) {
    const service = key.replace(prefix, '');
    const raw = await redis.lrange(key, 0, -1);
    if (raw.length === 0) continue;

    const samples = raw.map(Number).sort((a:number, b:number) => a - b);
    const avgMs = samples.reduce((sum: number, v: number) => sum + v, 0) / samples.length;
    const p95Index = Math.floor(samples.length * 0.95);
    const p95Ms = samples[Math.min(p95Index, samples.length - 1)];

    results.push({
      service,
      avgMs: Math.round(avgMs * 100) / 100,
      p95Ms: Math.round(p95Ms * 100) / 100,
      sampleCount: samples.length,
    });
  }

  return results;
}