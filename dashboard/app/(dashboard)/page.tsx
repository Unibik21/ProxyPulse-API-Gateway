"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import StatCard from "@/components/StatCard";
import StatusDot from "@/components/StatusDot";
import MethodBadge from "@/components/MethodBadge";
import PathChips from "@/components/PathChips";

export default function OverviewPage() {
  const { services, routes, users, apiKeys } = useStore();

  const activeRoutes = routes.filter((r) => r.is_active).length;
  const downServices = services.filter((s) => s.status === "down").length;
  const activeKeys = apiKeys.filter((k) => k.is_active).length;

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-[20px] font-semibold text-text">Overview</h1>
        <p className="mt-1 text-[13px] text-text-dim">
          Snapshot of what the control plane currently knows. Nothing here is proxying traffic yet —
          that&apos;s Phase 3.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Services" value={services.length} accent={downServices ? "text-danger" : "text-text"} />
        <StatCard label="Routes" value={`${activeRoutes}/${routes.length} active`} />
        <StatCard label="Users" value={users.length} />
        <StatCard label="Active keys" value={activeKeys} accent="text-signal" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
          <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-text">Services</h2>
            <Link href="/services" className="focus-ring text-[12px] text-signal hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-ink-border">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="text-[13px] text-text">{s.name}</div>
                  <div className="font-mono text-[11px] text-text-faint">{s.base_url}</div>
                </div>
                <StatusDot status={s.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-ink-border bg-ink-panel shadow-panel">
          <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-text">Recent routes</h2>
            <Link href="/routes" className="focus-ring text-[12px] text-signal hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-ink-border">
            {routes.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <MethodBadge method={r.method} />
                <PathChips path={r.path} />
                {!r.is_active && (
                  <span className="ml-auto text-[11px] text-text-faint">inactive</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
