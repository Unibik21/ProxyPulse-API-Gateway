type RouteConfig = {
    path:string;
    serviceName:string;
    baseUrl:string;
    rateLimit: number|null;
};

let routeTable: Map<string , RouteConfig>=new Map();

export async function refreshConfig(controlPlaneUrl:string){

    const res = await fetch(`${controlPlaneUrl}/api/config`);
    if(!res.ok){
        console.error('Failed to refresh config, keeping stale table');
        return;
    }
    const {routes} = await res.json() as {routes: RouteConfig[]};
    const newTable = new Map<string, RouteConfig>();
    for(const r of routes)newTable.set(r.path,r);
    routeTable = newTable;
    console.log(`Config refreshed : ${routeTable.size} routes loaded`);
}

export function getRoute(path:string): RouteConfig | undefined {
    return routeTable.get(path);
}

export function startConfigPolling(controlPlaneUrl:string, intervalMs=10_000){
    refreshConfig(controlPlaneUrl);
    setInterval(()=>refreshConfig(controlPlaneUrl),intervalMs);
}
