<<<<<<< HEAD
import Fastify from "fastify";
import { getRoute, startConfigPolling } from "./configStore.js";
import { config } from "./config.js";
=======
import Fastify from 'fastify';
import { getRoute, startConfigPolling } from './configStore.js';
import { config } from './config.js';

>>>>>>> d58ff72 (changes)

const app = Fastify({ logger: true });

app.all("/*", async (req, reply) => {
  const requestPath = req.url ?? "/";
  const routePath = requestPath.split("?")[0] ?? "/";
  const route = getRoute(routePath);

  if (!route) {
    return reply
      .status(400)
      .send({ error: "Nor route configured for this path" });
  }
  const targetUrl = `${route.baseUrl}${req.url}`;

  try{
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const body = await upstreamRes.arrayBuffer();
    upstreamRes.headers.forEach((value,key) => reply.header(key,value));
    return reply.send(Buffer.from(body));
  }
  catch(err){
    req.log.error(err);
    return reply.status(502).send({error: 'Upstream unreachable'});
  }

});

<<<<<<< HEAD
app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => app.log.info(`Gateway listening on ${config.port}, control plane running on ${config.downstreamUrl}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
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
=======
startConfigPolling(config.controlPlaneUrl);

const listenHost = '0.0.0.0';
const listenPort = config.port;

// #region agent log
fetch('http://127.0.0.1:7879/ingest/279b1d40-eff1-41a2-a00a-82738d0c5052',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'50c2db'},body:JSON.stringify({sessionId:'50c2db',runId:'pre-fix',hypothesisId:'A,B,D',location:'server.ts:listen-before',message:'Attempting to bind server',data:{listenHost,listenPort,envPort:process.env.PORT ?? null,resolvedPort:config.port},timestamp:Date.now()})}).catch(()=>{});
// #endregion

app.listen({ port: listenPort, host: listenHost })
  .then(() => {
    // #region agent log
    fetch('http://127.0.0.1:7879/ingest/279b1d40-eff1-41a2-a00a-82738d0c5052',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'50c2db'},body:JSON.stringify({sessionId:'50c2db',runId:'pre-fix',hypothesisId:'A',location:'server.ts:listen-success',message:'Server bound successfully',data:{listenHost,listenPort},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    app.log.info(`Gateway listening on ${config.port}, control plane running on ${config.controlPlaneUrl}`);
  })
  .catch((err) => {
    // #region agent log
    fetch('http://127.0.0.1:7879/ingest/279b1d40-eff1-41a2-a00a-82738d0c5052',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'50c2db'},body:JSON.stringify({sessionId:'50c2db',runId:'pre-fix',hypothesisId:'A,C,D,E',location:'server.ts:listen-error',message:'Server bind failed',data:{listenHost,listenPort,errorCode:(err as NodeJS.ErrnoException).code,errorErrno:(err as NodeJS.ErrnoException).errno,errorMessage:(err as Error).message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
>>>>>>> d58ff72 (changes)
    app.log.error(err);
    process.exit(1);
  });
