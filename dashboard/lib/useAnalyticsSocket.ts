'use client';

import { useEffect, useRef, useState } from 'react';

export type AnalyticsSnapshot = {
  type: 'analytics_snapshot';
  timestamp: string;
  latency: { service: string; avgMs: number; p95Ms: number; sampleCount: number }[];
  ipReputation: { ip: string; requestCount: number; suspicious: boolean }[];
  mostVisited: { path: string; hits: number }[];
  cacheRecommendations: { path: string; reason: string; detail: string }[];
};

const WS_URL = process.env.NEXT_PUBLIC_ANALYTICS_WS_URL || 'ws://localhost:8090';

export function useAnalyticsSocket() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000); // reconnect — analytics engine may restart independently
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'analytics_snapshot') setSnapshot(data);
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

  return { snapshot, connected };
}