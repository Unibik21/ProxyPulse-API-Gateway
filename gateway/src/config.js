"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
exports.config = {
    port: Number(process.env.PORT) || 7000,
    controlPlaneUrl: process.env.CONTROL_PLANE_URL || "http://localhost:3000",
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
