"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fastify_1 = require("fastify");
var configStore_js_1 = require("./configStore.js");
var auth_js_1 = require("./auth.js");
var rateLimiter_js_1 = require("./rateLimiter.js");
var cache_js_1 = require("./cache.js");
var healthCheck_js_1 = require("./healthCheck.js");
var config_js_1 = require("./config.js");
var metrics_js_1 = require("./metrics.js");
var logger_js_1 = require("./logger.js");
var app = (0, fastify_1.default)({ logger: true });
app.get('/metrics', function (_req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                reply.header('Content-Type', metrics_js_1.registry.register.contentType);
                _b = (_a = reply).send;
                return [4 /*yield*/, metrics_js_1.registry.register.metrics()];
            case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
        }
    });
}); });
app.all('/*', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, pathOnly, route, finish, authResult, _a, allowed, remaining, cached, _i, _b, _c, key, value, targetUrl, upstreamRes, bodyBuf, bodyText, headersObj_1, err_1;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                startTime = process.hrtime.bigint();
                pathOnly = req.url.split('?')[0];
                route = (0, configStore_js_1.getRoute)(pathOnly);
                finish = function (statusCode, serviceName, userId, cacheStatus) { return __awaiter(void 0, void 0, void 0, function () {
                    var durationSec;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                durationSec = Number(process.hrtime.bigint() - startTime) / 1e9;
                                metrics_js_1.httpRequestsTotal.inc({
                                    method: req.method,
                                    route: pathOnly,
                                    status_code: statusCode,
                                    service: serviceName !== null && serviceName !== void 0 ? serviceName : 'none',
                                });
                                metrics_js_1.httpRequestDuration.observe({
                                    method: req.method,
                                    route: pathOnly,
                                    status_code: statusCode,
                                    service: serviceName !== null && serviceName !== void 0 ? serviceName : 'none',
                                }, durationSec);
                                return [4 /*yield*/, (0, logger_js_1.pushLog)({
                                        timestamp: new Date().toISOString(),
                                        method: req.method,
                                        path: pathOnly,
                                        statusCode: statusCode,
                                        durationMs: durationSec * 1000,
                                        service: serviceName,
                                        userId: userId,
                                        ip: req.ip,
                                        cacheStatus: cacheStatus,
                                    })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); };
                if (!!route) return [3 /*break*/, 2];
                return [4 /*yield*/, finish(404, null, null, 'N/A')];
            case 1:
                _e.sent();
                return [2 /*return*/, reply
                        .status(404)
                        .send({ error: 'No route configured for this path' })];
            case 2: return [4 /*yield*/, (0, auth_js_1.authenticate)(req, reply)];
            case 3:
                authResult = _e.sent();
                if (!!authResult) return [3 /*break*/, 5];
                return [4 /*yield*/, finish(401, route.serviceName, null, 'N/A')];
            case 4:
                _e.sent();
                return [2 /*return*/];
            case 5: return [4 /*yield*/, (0, rateLimiter_js_1.checkRateLimit)(authResult.userId, pathOnly, (_d = route.rateLimit) !== null && _d !== void 0 ? _d : undefined)];
            case 6:
                _a = _e.sent(), allowed = _a.allowed, remaining = _a.remaining;
                reply.header('X-RateLimit-Remaining', remaining);
                if (!!allowed) return [3 /*break*/, 8];
                metrics_js_1.rateLimitRejectionsTotal.inc({
                    user_id: authResult.userId,
                    route: pathOnly,
                });
                return [4 /*yield*/, finish(429, route.serviceName, authResult.userId, 'N/A')];
            case 7:
                _e.sent();
                return [2 /*return*/, reply
                        .status(429)
                        .send({ error: 'Rate limit exceeded' })];
            case 8:
                if (!route.cacheTtl) return [3 /*break*/, 12];
                return [4 /*yield*/, (0, cache_js_1.getCachedResponse)(req)];
            case 9:
                cached = _e.sent();
                if (!cached) return [3 /*break*/, 11];
                metrics_js_1.cacheHitsTotal.inc({
                    route: pathOnly,
                });
                reply.header('X-Cache', 'HIT');
                reply.status(cached.status);
                for (_i = 0, _b = Object.entries(cached.headers); _i < _b.length; _i++) {
                    _c = _b[_i], key = _c[0], value = _c[1];
                    reply.header(key, value);
                }
                return [4 /*yield*/, finish(cached.status, route.serviceName, authResult.userId, 'HIT')];
            case 10:
                _e.sent();
                return [2 /*return*/, reply.send(cached.body)];
            case 11:
                metrics_js_1.cacheMissesTotal.inc({
                    route: pathOnly,
                });
                _e.label = 12;
            case 12:
                targetUrl = "".concat(route.baseUrl).concat(req.url);
                _e.label = 13;
            case 13:
                _e.trys.push([13, 19, , 21]);
                return [4 /*yield*/, fetch(targetUrl, {
                        method: req.method,
                        headers: req.headers,
                        body: ['GET', 'HEAD'].includes(req.method)
                            ? null
                            : JSON.stringify(req.body),
                    })];
            case 14:
                upstreamRes = _e.sent();
                return [4 /*yield*/, upstreamRes.arrayBuffer()];
            case 15:
                bodyBuf = _e.sent();
                bodyText = Buffer.from(bodyBuf).toString('utf-8');
                reply.status(upstreamRes.status);
                headersObj_1 = {};
                upstreamRes.headers.forEach(function (value, key) {
                    reply.header(key, value);
                    headersObj_1[key] = value;
                });
                reply.header('X-Cache', 'MISS');
                if (!route.cacheTtl) return [3 /*break*/, 17];
                return [4 /*yield*/, (0, cache_js_1.setCachedResponse)(req, upstreamRes.status, headersObj_1, bodyText, route.cacheTtl)];
            case 16:
                _e.sent();
                _e.label = 17;
            case 17: return [4 /*yield*/, finish(upstreamRes.status, route.serviceName, authResult.userId, route.cacheTtl ? 'MISS' : 'N/A')];
            case 18:
                _e.sent();
                return [2 /*return*/, reply.send(bodyText)];
            case 19:
                err_1 = _e.sent();
                req.log.error(err_1);
                return [4 /*yield*/, finish(502, route.serviceName, authResult.userId, 'N/A')];
            case 20:
                _e.sent();
                return [2 /*return*/, reply
                        .status(502)
                        .send({ error: 'Upstream unreachable' })];
            case 21: return [2 /*return*/];
        }
    });
}); });
(0, configStore_js_1.startConfigPolling)(config_js_1.config.controlPlaneUrl);
(0, healthCheck_js_1.startHealthChecks)();
app.listen({
    port: config_js_1.config.port,
    host: '0.0.0.0',
})
    .then(function () {
    app.log.info("Gateway listening on ".concat(config_js_1.config.port, ", control plane: ").concat(config_js_1.config.controlPlaneUrl));
})
    .catch(function (err) {
    app.log.error(err);
    process.exit(1);
});
