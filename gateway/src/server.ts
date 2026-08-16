import Fastify from "fastify";
import { getRoute, startConfigPolling } from "./configStore.js";
import { config } from "./config.js";
import { authenticate } from "./auth.js";
import { checkRateLimit } from './rateLimiter.js'

const app = Fastify({ logger: true });

app.all("/*", async (req, reply) => {
  const requestPath = req.url ?? "/";
  const routePath = requestPath.split("?")[0] ?? "/";
  const route = getRoute(routePath);


  // check if route is valid or not
  // if not return 400 or else proceed for auth
  if (!route) {
    return reply
      .status(400)
      .send({ error: "Nor route configured for this path" });
  }

  //auth
  const authResult = await authenticate(req, reply);
  if (!authResult) return;

  const { allowed, remaining } = await checkRateLimit(
    authResult.userId,
    routePath,
    route.rateLimit ?? undefined
  );
  reply.header('X - RateLimiting - Remaining', remaining);
  if (!allowed) {
    return reply.status(429).send({ error: 'Rate limit exceeded' });
  }

  const targetUrl = `${route.baseUrl}${requestPath}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: req.headers as HeadersInit,
    };

    const payload = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : JSON.stringify(req.body);
    if (payload !== undefined) {
      init.body = payload;
    }

    const upstreamRes = await fetch(targetUrl, init);

    const body = await upstreamRes.arrayBuffer();
    reply.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => reply.header(key, value));
    return reply.send(Buffer.from(body));
  } catch (err) {
    req.log.error(err);
    return reply.status(502).send({ error: "Upstream unreachable" });
  }
});

startConfigPolling(config.controlPlaneUrl);

app
  .listen({ port: config.port, host: "0.0.0.0" })
  .then(() =>
    app.log.info(
      `Gateway listening on ${config.port}, control plane running on ${config.controlPlaneUrl}`,
    ),
  )
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
