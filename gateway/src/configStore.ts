import { redis } from './redis.js'

type RouteConfig = {
  path: string;
  serviceName: string;
  baseUrl: string;
  rateLimit: number | null;
  cacheTtl:number;
  orgId: string;
  projectId: string | null;
};

let routeTable: Map<string, RouteConfig> = new Map();

export async function refreshConfig(controlPlaneUrl: string) {
  const res = await fetch(`${controlPlaneUrl}/api/config`);
  if (!res.ok) {
    console.error("Failed to refresh config, keeping stale table");
    return;
  }
  const { routes } = (await res.json()) as { routes: RouteConfig[] };
  const newTable = new Map<string, RouteConfig>();
  for (const r of routes) newTable.set(r.path, r);
  routeTable = newTable;
  console.log(`Config refreshed : ${routeTable.size} routes loaded`);
}

export function getRoute(path: string): RouteConfig | undefined {
  return routeTable.get(path);
}

export function startConfigPolling(
  controlPlaneUrl: string,
  intervalMs = 10_000,
) {
  refreshConfig(controlPlaneUrl);
  refreshApiKeys(controlPlaneUrl);
  setInterval(() => refreshConfig(controlPlaneUrl), intervalMs);
  setInterval(() => refreshApiKeys(controlPlaneUrl), intervalMs);
}

export function startApiKeyPolling(
  controlPlaneUrl: string,
  intervalMs = 10_000,
) {
  refreshApiKeys(controlPlaneUrl);
  setInterval(() => refreshApiKeys(controlPlaneUrl), intervalMs);
}

export async function refreshApiKeys(controlPlaneUrl: string) {
  const res = await fetch(`${controlPlaneUrl}/api/api-keys/active`);
  if (!res.ok) return;
  const { keys } = await res.json() as { keys: { key: string; userId: string; expiresAt: string | null}[] };
  const pipeline = redis.pipeline();
  pipeline.del('valid_api_keys');
  for (const k of keys) {
    pipeline.sadd('valid_api_keys', k.key);
    pipeline.set(`api_key_meta:${k.key}`, JSON.stringify({ userId: k.userId }));
  }
  await pipeline.exec();
}

export async function getAllServices(): Promise<{ name: string; baseUrl: string}[]>{
  const services = new Map<string, {name:string; baseUrl:string}>();

  for(const route of routeTable.values()){
    services.set(route.serviceName,{
      name: route.serviceName,
      baseUrl: route.baseUrl,
    });
  }

  return Array.from(services.values());
}