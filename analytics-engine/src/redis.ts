import Redis from 'ioredis';
import { config } from './config.js';

export const redis = new Redis(config.redisUrl);
export const blockingRedis = new Redis(config.redisUrl)

redis.on('error', (err:Error) => console.error('Redis error: ', err));
blockingRedis.on('error', (err:Error) => console.error('Blocking redis error: ', err))