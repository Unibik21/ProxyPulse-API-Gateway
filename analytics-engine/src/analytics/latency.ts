import { redis } from "../redis.js";
import type { LogEntry } from "../types.js";

const MAX_SAMPLES = 1000; // capped rolling window per service, avoids unbounded memory

export async function recordLatency(entry: LogEntry) {
  if (!entry.service || !entry.orgId) return;
  const key = `analytics:${entry.orgId}:latency:${entry.service}`;
  await redis.lpush(key, entry.durationMs);
  await redis.ltrim(key, 0, MAX_SAMPLES - 1);
}

export type LatencyStats = {
  service: string;
  avgMs: number;
  p95Ms: number;
  sampleCount: number;
};

export async function computeLatencyStats(orgId: string): Promise<LatencyStats[]> {
  const keys = await redis.keys(`analytics:${orgId}:latency:*`);
  const results: LatencyStats[] = [];

  for (const key of keys) {
    const service = key.replace(`analytics:${orgId}:latency:`, '');
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