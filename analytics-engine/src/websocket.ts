import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { computeLatencyStats } from './analytics/latency.js';
import { computeIpReputation } from './analytics/ipReputation.js';
import { computeMostVisited } from './analytics/popularEndpoints.js';
import { computeCacheRecommendations } from './analytics/cacheRecommendations.js';

let wss: WebSocketServer;

export function startWebSocketServer() {
  wss = new WebSocketServer({ port: config.wsPort });
  console.log(`Analytics engine: WebSocket server listening on ${config.wsPort}`);

  wss.on('connection', (socket) => {
    console.log('Dashboard client connected');
    socket.on('close', () => console.log('Dashboard client disconnected'));
  });

  setInterval(broadcastSnapshot, config.broadcastIntervalMs);
}

async function broadcastSnapshot() {
  if (!wss || wss.clients.size === 0) return; // skip the Redis reads if nobody's listening

  const [latency, ipReputation, mostVisited, cacheRecommendations] = await Promise.all([
    computeLatencyStats(),
    computeIpReputation(),
    computeMostVisited(),
    computeCacheRecommendations(),
  ]);

  const payload = JSON.stringify({
    type: 'analytics_snapshot',
    timestamp: new Date().toISOString(),
    latency,
    ipReputation,
    mostVisited,
    cacheRecommendations,
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}