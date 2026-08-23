"use client";

import { useAnalyticsSocket } from "@/lib/useAnalyticsSocket";

export default function AnalyticsPage() {
  const { snapshot, connected } = useAnalyticsSocket();

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[20px] font-semibold text-text">
              Live Analytics
            </h1>
            <p className="mt-1 text-[13px] text-text-dim">
              Real-time traffic, latency, endpoint usage, and cache insights.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-ink-border bg-ink-panel px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-signal" : "bg-danger"
              }`}
            />

            <span
              className={`text-[12px] font-medium ${
                connected ? "text-signal" : "text-danger"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Waiting state */}
      {!snapshot && (
        <section className="rounded-lg border border-ink-border bg-ink-panel p-8 text-center shadow-panel">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-ink-border2 bg-ink-panel2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-signal" />
          </div>

          <h2 className="text-[14px] font-semibold text-text">
            Waiting for analytics data
          </h2>

          <p className="mt-1 text-[12px] text-text-dim">
            Waiting for the first snapshot from the analytics service...
          </p>
        </section>
      )}

      {snapshot && (
        <div className="grid grid-cols-2 gap-4">
          {/* Latency */}
          <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-text">
                  Latency by Service
                </h2>
                <p className="mt-0.5 text-[11px] text-text-faint">
                  Average and p95 response latency
                </p>
              </div>

              <span className="rounded border border-ink-border2 bg-ink-panel2 px-2 py-1 font-mono text-[10px] text-text-dim">
                LIVE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-ink-border text-left">
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Service
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Avg
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      p95
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Samples
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-ink-border">
                  {snapshot.latency.map((l) => (
                    <tr
                      key={l.service}
                      className="transition-colors hover:bg-ink-panel2"
                    >
                      <td className="px-4 py-3 text-[12px] font-medium text-text">
                        {l.service}
                      </td>

                      <td className="px-4 py-3 font-mono text-[12px] text-signal">
                        {l.avgMs} ms
                      </td>

                      <td className="px-4 py-3 font-mono text-[12px] text-wire">
                        {l.p95Ms} ms
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-text-dim">
                        {l.sampleCount}
                      </td>
                    </tr>
                  ))}

                  {snapshot.latency.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-[12px] text-text-faint"
                      >
                        No latency data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Most Visited */}
          <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-text">
                  Most Visited Endpoints
                </h2>
                <p className="mt-0.5 text-[11px] text-text-faint">
                  Endpoints receiving the most traffic
                </p>
              </div>

              <span className="rounded border border-ink-border2 bg-ink-panel2 px-2 py-1 font-mono text-[10px] text-text-dim">
                TRAFFIC
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-ink-border text-left">
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Path
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Hits
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-ink-border">
                  {snapshot.mostVisited.map((m) => (
                    <tr
                      key={m.path}
                      className="transition-colors hover:bg-ink-panel2"
                    >
                      <td className="px-4 py-3">
                        <code className="rounded bg-ink-panel2 px-2 py-1 font-mono text-[11px] text-route">
                          {m.path}
                        </code>
                      </td>

                      <td className="px-4 py-3 font-mono text-[12px] font-medium text-text">
                        {m.hits.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {snapshot.mostVisited.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-6 text-center text-[12px] text-text-faint"
                      >
                        No endpoint traffic available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* IP Reputation */}
          <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-text">
                  IP Reputation
                </h2>
                <p className="mt-0.5 text-[11px] text-text-faint">
                  Traffic patterns and suspicious sources
                </p>
              </div>

              <span className="rounded border border-ink-border2 bg-ink-panel2 px-2 py-1 font-mono text-[10px] text-text-dim">
                SECURITY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-ink-border text-left">
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      IP Address
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Requests
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-medium text-text-faint">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-ink-border">
                  {snapshot.ipReputation.map((ip) => (
                    <tr
                      key={ip.ip}
                      className="transition-colors hover:bg-ink-panel2"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-text">
                        {ip.ip}
                      </td>

                      <td className="px-4 py-3 font-mono text-[12px] text-text-dim">
                        {ip.requestCount.toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        {ip.suspicious ? (
                          <span className="inline-flex items-center gap-1.5 rounded border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-medium text-danger">
                            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                            Suspicious
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded border border-signal/20 bg-signal/5 px-2 py-1 text-[10px] font-medium text-signal">
                            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {snapshot.ipReputation.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-[12px] text-text-faint"
                      >
                        No IP reputation data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cache Recommendations */}
          <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-text">
                  Cache Recommendations
                </h2>
                <p className="mt-0.5 text-[11px] text-text-faint">
                  Potential opportunities to improve response performance
                </p>
              </div>

              <span className="rounded border border-ink-border2 bg-ink-panel2 px-2 py-1 font-mono text-[10px] text-text-dim">
                CACHE
              </span>
            </div>

            <div className="p-4">
              {snapshot.cacheRecommendations.length === 0 ? (
                <div className="rounded-md border border-ink-border bg-ink-panel2 px-4 py-5 text-center">
                  <div className="text-[12px] font-medium text-text">
                    No recommendations
                  </div>

                  <p className="mt-1 text-[11px] text-text-faint">
                    Your current traffic does not suggest any cache changes.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {snapshot.cacheRecommendations.map((r, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-ink-border bg-ink-panel2 px-3 py-3 transition-colors hover:border-ink-border2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-route/20 bg-route/5">
                          <span className="text-[11px] text-route">↗</span>
                        </div>

                        <div className="min-w-0">
                          <code className="font-mono text-[11px] text-route">
                            {r.path}
                          </code>

                          <p className="mt-1 text-[12px] leading-5 text-text-dim">
                            {r.detail}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}