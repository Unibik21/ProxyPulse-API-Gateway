export type LogEntry = {
    timestamp:string;
    method:string;
    path:string;
    statusCode: number;
    durationMs: number;
    service:string|null;
    userId:string|null;
    ip:string;
    cacheStatus:'HIT' | 'MISS' | 'N/A';
};