import "dotenv/config"

export const config = {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    wsPort: Number(process.env.WS_PORT) || 8090,
    broadcastIntervalMs: Number(process.env.BROADCAST_INTERVAL_MS) || 5000,
    ipSpamThreshold : Number(process.env.IP_SPAM_THRESHOLD)|| 200,
    isSpamWindowSec: 60,
};