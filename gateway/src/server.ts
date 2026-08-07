import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';
import { config } from './config.js';

const app = Fastify({ logger: true });

app.register(proxy, {
  upstream: config.downstreamUrl,
  prefix: '/',
  rewritePrefix: '/',
});

// this is my import {  } from "module";
app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => app.log.info(`Gateway listening on ${config.port} -> ${config.downstreamUrl}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
