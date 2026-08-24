"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/",          label: "Overview",  glyph: "◇" },
  { href: "/services",  label: "Services",  glyph: "▣" },
  { href: "/routes",    label: "Routes",    glyph: "⇥" },
  { href: "/api-keys",  label: "API keys",  glyph: "◈" },
  { href: "/users",     label: "Users",     glyph: "◐" },
  { href: "/analytics", label: "Analytics", glyph: "▥" },
];

interface Me {
  name:  string | null;
  email: string;
  org:   { name: string; slug: string } | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [me,      setMe]      = useState<Me | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setMe(data ?? null))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink-border bg-ink-panel">
      {/* Header */}
      <div className="px-5 pb-4 pt-6">
        <div className="font-display text-[15px] font-semibold tracking-tight text-text">
          Proxy Pulse
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-text-faint">admin console</div>
        {me?.org && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            <span className="truncate font-mono text-[11px] font-medium text-signal">
              {me.org.name}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring group mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-ink-panel2 text-text shadow-panel"
                  : "text-text-dim hover:bg-ink-panel2/60 hover:text-text"
              }`}
            >
              <span
                className={`font-mono text-[13px] ${active ? "text-signal" : "text-text-faint group-hover:text-signal"}`}
              >
                {item.glyph}
              </span>
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-signal" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer: user info + logout */}
      <div className="mx-3 mb-3 space-y-2">
        {/* Connected badge */}
        <div className="rounded-lg border border-ink-border bg-ink px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-signal" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="text-[11px] font-medium text-text-dim">Connected</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-text-faint">
            Changes persist to the database.
          </p>
        </div>

        {/* User + logout */}
        {me && (
          <div className="rounded-lg border border-ink-border bg-ink px-3 py-2.5">
            <p className="truncate text-[12px] font-medium text-text">{me.name ?? me.email}</p>
            <p className="truncate font-mono text-[10px] text-text-faint">{me.email}</p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 w-full rounded border border-ink-border px-2 py-1 text-[11px] text-text-dim transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
