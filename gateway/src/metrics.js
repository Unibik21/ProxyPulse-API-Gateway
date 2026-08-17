"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.rateLimitRejectionsTotal = exports.cacheMissesTotal = exports.cacheHitsTotal = exports.httpRequestDuration = exports.httpRequestsTotal = void 0;
var prometheus = require("prom-client");
exports.registry = prometheus;
// Collects default Node process metrics
prometheus.collectDefaultMetrics();
exports.httpRequestsTotal = new prometheus.Counter({
    name: 'gateway_http_requests_total',
    help: 'Total number of HTTP requests processed by the gateway',
    labelNames: ['method', 'route', 'status_code', 'service'],
});
exports.httpRequestDuration = new prometheus.Histogram({
    name: 'gateway_http_request_duration_seconds',
    help: 'HTTP request latency in seconds, from gateway entry to response sent',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
exports.cacheHitsTotal = new prometheus.Counter({
    name: 'gateway_cache_hits_total',
    help: 'Total number of response cache hits',
    labelNames: ['route'],
});
exports.cacheMissesTotal = new prometheus.Counter({
    name: 'gateway_cache_misses_total',
    help: 'Total number of response cache misses',
    labelNames: ['route'],
});
exports.rateLimitRejectionsTotal = new prometheus.Counter({
    name: 'gateway_rate_limit_rejections_total',
    help: 'Total number of requests rejected due to rate limiting',
    labelNames: ['user_id', 'route'],
});
