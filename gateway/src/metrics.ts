import client from 'prom-client';

// Collects default Node process metrics
client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
    name: 'gateway_http_requests_total',
    help: 'Total number of HTTP requests processed by the gateway',
    labelNames: ['method','route','status_code','service'] as const,
});

export const httpRequestDuration = new client.Histogram({
    name : 'gateway_http_request_duration_seconds',
    help: 'HTTP request latency in seconds, from gateway entry to response sent',
    labelNames:['method','route','status_code','service'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export const cacheHitsTotal = new client.Counter({
    name:'gateway_cache_hits_total',
    help: 'Total number of response cache hits',
    labelNames: ['route'] as const,
});

export const cacheMissesTotal = new client.Counter({
  name: 'gateway_cache_misses_total',
  help: 'Total number of response cache misses',
  labelNames: ['route'] as const,
});

export const rateLimitRejectionsTotal = new client.Counter({
  name: 'gateway_rate_limit_rejections_total',
  help: 'Total number of requests rejected due to rate limiting',
  labelNames: ['user_id', 'route'] as const,
});


export {client as registry};