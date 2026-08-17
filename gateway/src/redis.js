"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
var ioredis_1 = require("ioredis");
var config_js_1 = require("./config.js");
exports.redis = new ioredis_1.Redis(config_js_1.config.redisUrl);
exports.redis.on('error', function (err) { return console.error('Redis error: ', err); });
