import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { config } from './config.js';
import { computeLatencyStats } from './analytics/latency.js';
import { computeIpReputation } from './analytics/ipReputation.js';
import { computeMostVisited } from './analytics/popularEndpoints.js';
import { computeCacheRecommendations } from './analytics/cacheRecommendations.js';

let wss: WebSocketServer;

// Maps each connected socket to the project it subscribed to
const socketScope = new WeakMap<WebSocket, { orgId: string; projectId: string }>();

export function startWebSocketServer() {
  wss = new WebSocketServer({ port: config.wsPort });
  console.log(`Analytics engine: WebSocket server listening on ${config.wsPort}`);

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const orgId = new URL(req.url!, 'ws://localhost').searchParams.get('orgId');
    const projectId = new URL(req.url!, 'ws://localhost').searchParams.get('projectId');
    if (!orgId || !projectId) {
      socket.close(1008, 'Missing orgId or projectId');
      return;
    }
    socketScope.set(socket, { orgId, projectId });
    console.log(`Dashboard client connected (orgId=${orgId}, projectId=${projectId})`);
    socket.on('close', () => console.log(`Dashboard client disconnected (orgId=${orgId}, projectId=${projectId})`));
  });

  setInterval(broadcastSnapshot, config.broadcastIntervalMs);
}

async function broadcastSnapshot() {
  if (!wss || wss.clients.size === 0) return;

  // Collect the unique orgIds that currently have open clients
  const scopedClients = new Map<string, { orgId: string; projectId: string; clients: WebSocket[] }>();
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    const scope = socketScope.get(client);
    if (!scope) continue;
    const key = `${scope.orgId}:${scope.projectId}`;
    const bucket = scopedClients.get(key) ?? { ...scope, clients: [] };
    bucket.clients.push(client);
    scopedClients.set(key, bucket);
  }

  if (scopedClients.size === 0) return;

  // Compute stats once per unique orgId, then fan out to that org's clients
  await Promise.all(
    Array.from(scopedClients.values()).map(async ({ orgId, projectId, clients }) => {
      const [latency, ipReputation, mostVisited, cacheRecommendations] = await Promise.all([
        computeLatencyStats(orgId, projectId),
        computeIpReputation(orgId, projectId),
        computeMostVisited(orgId, projectId),
        computeCacheRecommendations(orgId, projectId),
      ]);

      const payload = JSON.stringify({
        type: 'analytics_snapshot',
        timestamp: new Date().toISOString(),
        latency,
        ipReputation,
        mostVisited,
        cacheRecommendations,
      });

      for (const client of clients) {
        client.send(payload);
      }
    })
  );
}
