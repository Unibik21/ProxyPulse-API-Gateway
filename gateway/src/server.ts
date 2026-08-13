import Fastify from 'fastify';
import { getRoute, startConfigPolling } from './configStore';
import { config } from './config.js';


const app = Fastify({ logger: true });

app.all('/*', async(req, reply) -> {
  const route = getRoute(req.url.split('?')[0]);

  if(!route) {
    return reply.status(400).send({ error: 'Nor route configured for this path' });
  }

  const targetUrl = `${route.baseURL}${req.url}`;

});

// this is my import {  } from "module";
app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => app.log.info(`Gateway listening on ${config.port} -> ${config.downstreamUrl}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => app.log.info(`Gateway listening on ${config.port} -> ${config.downstreamUrl}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

