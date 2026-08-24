import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { config } from './config.js';
import { computeLatencyStats } from './analytics/latency.js';
import { computeIpReputation } from './analytics/ipReputation.js';
import { computeMostVisited } from './analytics/popularEndpoints.js';
import { computeCacheRecommendations } from './analytics/cacheRecommendations.js';

let wss: WebSocketServer;

// Maps each connected socket to the orgId it authenticated with
const socketOrgId = new WeakMap<WebSocket, string>();

export function startWebSocketServer() {
  wss = new WebSocketServer({ port: config.wsPort });
  console.log(`Analytics engine: WebSocket server listening on ${config.wsPort}`);

  wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
    const orgId = new URL(req.url!, 'ws://localhost').searchParams.get('orgId');
    if (!orgId) {
      socket.close(1008, 'Missing orgId');
      return;
    }
    socketOrgId.set(socket, orgId);
    console.log(`Dashboard client connected (orgId=${orgId})`);
    socket.on('close', () => console.log(`Dashboard client disconnected (orgId=${orgId})`));
  });

  setInterval(broadcastSnapshot, config.broadcastIntervalMs);
}

async function broadcastSnapshot() {
  if (!wss || wss.clients.size === 0) return;

  // Collect the unique orgIds that currently have open clients
  const orgClients = new Map<string, WebSocket[]>();
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    const orgId = socketOrgId.get(client);
    if (!orgId) continue;
    const bucket = orgClients.get(orgId) ?? [];
    bucket.push(client);
    orgClients.set(orgId, bucket);
  }

  if (orgClients.size === 0) return;

  // Compute stats once per unique orgId, then fan out to that org's clients
  await Promise.all(
    Array.from(orgClients.entries()).map(async ([orgId, clients]) => {
      const [latency, ipReputation, mostVisited, cacheRecommendations] = await Promise.all([
        computeLatencyStats(orgId),
        computeIpReputation(orgId),
        computeMostVisited(orgId),
        computeCacheRecommendations(orgId),
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
