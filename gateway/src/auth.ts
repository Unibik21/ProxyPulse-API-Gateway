import { createHash } from 'crypto';
import { redis } from './redis.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<{ userId: string } | null> {
  const rawKey = req.headers['x-api-key'] as string | undefined;
  if (!rawKey) {
    reply.status(401).send({ error: 'Missing X-Api-Key header' });
    return null;
  }

  const hashedKey = createHash('sha256').update(rawKey).digest('hex');
  const isValid = await redis.sismember('valid_api_keys', hashedKey);


  if (!isValid) {
    reply.status(401).send({ error: 'Invalid or revoked API key' });
    return null;
  }

  const metaRaw = await redis.get(`api_key_meta:${hashedKey}`);
  const meta = metaRaw ? JSON.parse(metaRaw) : { userId: 'unknown' };
  return { userId: meta.userId };
}
