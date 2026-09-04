import Fastify from 'fastify';

const app = Fastify({ logger: true });

// Health check — used by Render's health check AND your gateway's Phase 5 health cache
app.get('/health', async () => ({ status: 'ok' }));

// Basic echo — fast response, good for testing cache hit rates
app.get('/echo', async (req) => ({
  message: 'Hello from dummy service',
  timestamp: new Date().toISOString(),
  query: req.query,
}));

// Simulated latency — randomized delay so your analytics engine's
// p95 latency stat actually shows something meaningful instead of a flat line
app.get('/slow', async (req, reply) => {
  const delayMs = 100 + Math.random() * 400; // 100-500ms
  await new Promise((r) => setTimeout(r, delayMs));
  return { message: 'That took a while', delayMs: Math.round(delayMs) };
});

// Occasional errors — useful for confirming your gateway never caches 5xx responses
app.get('/flaky', async (req, reply) => {
  if (Math.random() < 0.3) {
    return reply.status(500).send({ error: 'Simulated failure' });
  }
  return { message: 'Success this time' };
});

const port = Number(process.env.PORT) || 4000;
app.listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Dummy service listening on ${port}`))
  .catch((err) => { app.log.error(err); process.exit(1); });