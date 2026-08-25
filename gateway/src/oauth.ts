import { createHash } from 'crypto';
import { redis } from './redis.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  auth: {
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
  };
  scope?: string[];
}

export const oauthProviders: Record<string, OAuthProvider> = {};

export function registerOAuthProvider(name: string, provider: OAuthProvider) {
  oauthProviders[name] = provider;
}

export async function initiateOAuth(
  req: FastifyRequest,
  reply: FastifyReply,
  providerName: string
) {
  const providerConfig = oauthProviders[providerName];
  if (!providerConfig) {
    reply.status(400).send({ error: 'Invalid OAuth provider' });
    return;
  }

  const state = createHash('sha256').update(Date.now().toString()).digest('hex');
  const redirectUri = `${process.env.CONTROL_PLANE_URL}/oauth/callback`;

  // Store state in Redis for CSRF protection
  await redis.set(`oauth_state:${state}`, JSON.stringify({ provider: providerName, expires: Date.now() + 300000 }), 'EX', 300);

  const authorizeUrl = `${providerConfig.auth.authorizeUrl}?response_type=code&client_id=${providerConfig.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(providerConfig.scope?.join(' ') || 'openid email profile')}&state=${state}`;

  reply.redirect(authorizeUrl);
}

export async function oauthCallback(
  req: FastifyRequest,
  reply: FastifyReply,
  providerName: string
) {
  const providerConfig = oauthProviders[providerName];
  if (!providerConfig) {
    reply.status(400).send({ error: 'Invalid OAuth provider' });
    return;
  }

  const code = (req.query as { code?: string }).code as string;
  const state = (req.query as { state?: string }).state as string;

  if (!code || !state) {
    reply.status(400).send({ error: 'Missing code or state' });
    return;
  }

  // Verify state
  const storedState = await redis.get(`oauth_state:${state}`);
  if (!storedState) {
    reply.status(400).send({ error: 'Invalid or expired state' });
    return;
  }

  const parsedState = JSON.parse(storedState);
  if (parsedState.provider !== providerName) {
    reply.status(400).send({ error: 'State mismatch' });
    return;
  }

  // In a real implementation, you would exchange the code for tokens
  // For now, we'll create a dummy user entry
  const email = `oauth_${providerName}_${code}@example.com`;
  const hashedKey = createHash('sha256').update(email).digest('hex');

  await redis.sadd('valid_api_keys', hashedKey);
  await redis.set(`api_key_meta:${hashedKey}`, JSON.stringify({ userId: email }));

  reply.status(200).send({
    userId: email,
    token: 'oauth_token_placeholder',
  });
}