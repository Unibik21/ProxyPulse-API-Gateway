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

const WS_BASE = process.env.NEXT_PUBLIC_ANALYTICS_WS_URL || 'ws://localhost:8090';

export function useAnalyticsSocket(orgId: string | null) {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Don't connect until we know the orgId
    if (!orgId) return;

    const wsUrl = `${WS_BASE}?orgId=${encodeURIComponent(orgId)}`;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen  = () => !cancelled && setConnected(true);
      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        setTimeout(connect, 2000);
      };
      ws.onerror  = () => ws.close();
      ws.onmessage = (event) => {
        if (cancelled) return;
        const data = JSON.parse(event.data as string);
        if (data.type === 'analytics_snapshot') setSnapshot(data);
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [orgId]); // reconnect when orgId changes

  return { snapshot, connected };
}
