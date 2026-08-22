import {redis} from './redis.js';
import {getAllServices} from './configStore.js';

export async function checkServiceHealth(){
    const services = await getAllServices();
    for(const svc of services){
        try{
            const res = await fetch(`${svc.baseUrl}/health`,{signal:AbortSignal.timeout(2000)});
            await redis.set(`service_health:${svc.name}`, res.ok ? 'healthy': 'unhealthy','EX',30);

        }
        catch{
            await redis.set(`service_name:${svc.name}`,'unreachable','EX',30);
        }
    }
}


export function startHealthChecks(intervalMs =  15_000){
    checkServiceHealth();
    setInterval(checkServiceHealth, intervalMs);
}

