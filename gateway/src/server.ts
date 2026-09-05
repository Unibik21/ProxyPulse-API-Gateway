import Fastify from 'fastify';
import {
  getRoute,
  startConfigPolling,
} from './configStore.js';
import { authenticate } from './auth.js';
import { checkRateLimit } from './rateLimiter.js';
import { getCachedResponse, setCachedResponse } from './cache.js';
import { startHealthChecks } from './healthCheck.js';
import { config } from './config.js';
import { pushLog } from './logger.js';
import { registerOAuthProvider, initiateOAuth, oauthCallback } from './oauth.js';
import { sendOtp, verifyOtp } from './otp.js';
import {
  httpRequestsTotal,
  httpRequestDuration,
  cacheHitsTotal,
  cacheMissesTotal,
  rateLimitRejectionsTotal,
  registry,
} from './metrics.js';

const app = Fastify({ logger: true, trustProxy: true, });

app.get('/metrics', async (_req, reply) => {
  reply.header('Content-Type', registry.register.contentType);
  return reply.send(await registry.register.metrics());
});

app.register(async (app) => {
  app.post('/oauth/register', async (req, reply) => {
    const { name, clientId, clientSecret, auth } = req.body as {
      name: string;
      clientId: string;
      clientSecret: string;
      auth: { authorizeUrl: string; tokenUrl: string; userInfoUrl: string };
    };
    registerOAuthProvider(name, { name, clientId, clientSecret, auth });
    reply.send({ message: 'OAuth provider registered' });
  });

  app.get('/oauth/start', async (req, reply) => {
    const { provider } = req.query as { provider: string };
    initiateOAuth(req, reply, provider);
  });

  app.get('/oauth/callback', async (req, reply) => {
    const { provider } = req.query as { provider: string };
    await oauthCallback(req, reply, provider);
  });

  app.post('/otp/send', async (req, reply) => {
    const { email } = req.body as { email: string };
    await sendOtp(req, reply, email);
  });

  app.post('/otp/verify', async (req, reply) => {
    await verifyOtp(req, reply);
  });
});

app.all('/*', async (req, reply) => {
  const startTime = process.hrtime.bigint();
  const pathOnly = req.url.split('?')[0] as string;
  const route = getRoute(pathOnly, req.method);

  const finish = async (
    statusCode: number,
    serviceName: string | null,
    userId: string | null,
    cacheStatus: 'HIT' | 'MISS' | 'N/A',
    orgId: string | null,
    projectId: string | null
  ) => {
    const durationSec =
      Number(process.hrtime.bigint() - startTime) / 1e9;

    httpRequestsTotal.inc({
      method: req.method,
      route: pathOnly,
      status_code: statusCode,
      service: serviceName ?? 'none',
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: pathOnly,
        status_code: statusCode,
        service: serviceName ?? 'none',
      },
      durationSec
    );

    await pushLog({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: pathOnly,
      statusCode,
      durationMs: durationSec * 1000,
      service: serviceName,
      userId,
      ip: req.ip,
      cacheStatus,
      orgId,
      projectId,
    });
  };

  if (!route) {
    await finish(404, null, null, 'N/A', null, null);

    return reply
      .status(404)
      .send({ error: 'No route configured for this path' });
  }

  if (!route.active) {
    await finish(503, route.serviceName, null, 'N/A', route.orgId, route.projectId);

    return reply
      .status(503)
      .send({ error: 'Route is currently disabled' });
  }

  const authResult = await authenticate(req, reply);

  if (!authResult) {
    await finish(401, route.serviceName, null, 'N/A', route?.orgId ?? null, route?.projectId ?? null);
    return;
  }

  const { allowed, remaining } = await checkRateLimit(
    authResult.userId,
    pathOnly,
    route.rateLimit ?? undefined
  );

  reply.header('X-RateLimit-Remaining', remaining);

  if (!allowed) {
    rateLimitRejectionsTotal.inc({
      user_id: authResult.userId,
      route: pathOnly,
    });

    await finish(
      429,
      route.serviceName,
      authResult.userId,
      'N/A',
      route?.orgId ?? null,
      route?.projectId ?? null
    );

    return reply
      .status(429)
      .send({ error: 'Rate limit exceeded' });
  }

  if (route.cacheTtl) {
    const cached = await getCachedResponse(req);

    if (cached) {
      cacheHitsTotal.inc({
        route: pathOnly,
      });

      reply.header('X-Cache', 'HIT');
      reply.status(cached.status);

      for (const [key, value] of Object.entries(cached.headers)) {
        reply.header(key, value);
      }

      await finish(
        cached.status,
        route.serviceName,
        authResult.userId,
        'HIT',
        route?.orgId ?? null,
        route?.projectId ?? null
      );

      return reply.send(cached.body);
    }

    cacheMissesTotal.inc({
      route: pathOnly,
    });
  }

  const targetUrl = `${route.baseUrl}${req.url}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: ['GET', 'HEAD'].includes(req.method)
        ? null
        : JSON.stringify(req.body),
    });

    const bodyBuf = await upstreamRes.arrayBuffer();
    const bodyText = Buffer.from(bodyBuf).toString('utf-8');

    reply.status(upstreamRes.status);

    const headersObj: Record<string, string> = {};

    upstreamRes.headers.forEach((value, key) => {
      reply.header(key, value);
      headersObj[key] = value;
    });

    reply.header('X-Cache', 'MISS');

    if (route.cacheTtl) {
      await setCachedResponse(
        req,
        upstreamRes.status,
        headersObj,
        bodyText,
        route.cacheTtl
      );
    }

    await finish(
      upstreamRes.status,
      route.serviceName,
      authResult.userId,
      route.cacheTtl ? 'MISS' : 'N/A',
      route?.orgId ?? null,
      route?.projectId ?? null
    );

    return reply.send(bodyText);
  } catch (err) {
    req.log.error(err);

    await finish(
      502,
      route.serviceName,
      authResult.userId,
      'N/A',
      route?.orgId ?? null,
      route?.projectId ?? null
    );

    return reply
      .status(502)
      .send({ error: 'Upstream unreachable' });
  }
});

startConfigPolling(config.controlPlaneUrl);
startHealthChecks();

app.listen({
  port: config.port,
  host: '0.0.0.0',
})
  .then(() => {
    app.log.info(
      `Gateway listening on ${config.port}, control plane: ${config.controlPlaneUrl}`
    );
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });