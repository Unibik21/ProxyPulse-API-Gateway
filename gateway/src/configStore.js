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
exports.refreshConfig = refreshConfig;
exports.getRoute = getRoute;
exports.startConfigPolling = startConfigPolling;
exports.refreshApiKeys = refreshApiKeys;
exports.getAllServices = getAllServices;
var redis_js_1 = require("./redis.js");
var routeTable = new Map();
function refreshConfig(controlPlaneUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var res, routes, newTable, _i, routes_1, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(controlPlaneUrl, "/api/config"))];
                case 1:
                    res = _a.sent();
                    if (!res.ok) {
                        console.error("Failed to refresh config, keeping stale table");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    routes = (_a.sent()).routes;
                    newTable = new Map();
                    for (_i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
                        r = routes_1[_i];
                        newTable.set(r.path, r);
                    }
                    routeTable = newTable;
                    console.log("Config refreshed : ".concat(routeTable.size, " routes loaded"));
                    return [2 /*return*/];
            }
        });
    });
}
function getRoute(path) {
    return routeTable.get(path);
}
function startConfigPolling(controlPlaneUrl, intervalMs) {
    if (intervalMs === void 0) { intervalMs = 10000; }
    refreshConfig(controlPlaneUrl);
    setInterval(function () { return refreshConfig(controlPlaneUrl); }, intervalMs);
}
function refreshApiKeys(controlPlaneUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var res, keys, pipeline, _i, keys_1, k;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(controlPlaneUrl, "/api/api-keys/active"))];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        return [2 /*return*/];
                    return [4 /*yield*/, res.json()];
                case 2:
                    keys = (_a.sent()).keys;
                    pipeline = redis_js_1.redis.pipeline();
                    pipeline.del('valid_api_keys');
                    for (_i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                        k = keys_1[_i];
                        pipeline.sadd('valid_api_keys', k.key);
                        pipeline.set("api_key_set:".concat(k.key), JSON.stringify({ userId: k.userId }));
                    }
                    return [4 /*yield*/, pipeline.exec()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getAllServices() {
    return __awaiter(this, void 0, void 0, function () {
        var services, _i, _a, route;
        return __generator(this, function (_b) {
            services = new Map();
            for (_i = 0, _a = routeTable.values(); _i < _a.length; _i++) {
                route = _a[_i];
                services.set(route.serviceName, {
                    name: route.serviceName,
                    baseUrl: route.baseUrl,
                });
            }
            return [2 /*return*/, Array.from(services.values())];
        });
    });
}
