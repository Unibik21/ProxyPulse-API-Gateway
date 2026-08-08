"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", glyph: "◇" },
  { href: "/services", label: "Services", glyph: "▣" },
  { href: "/routes", label: "Routes", glyph: "⇥" },
  { href: "/api-keys", label: "API keys", glyph: "◈" },
  { href: "/users", label: "Users", glyph: "◐" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-ink-border bg-ink-panel">
      <div className="px-5 pb-5 pt-6">
        <div className="font-display text-[15px] font-semibold tracking-tight text-text">
          Control Plane
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-text-faint">admin console</div>
      </div>

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

      <div className="mx-3 mb-4 rounded-lg border border-ink-border bg-ink px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-route" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-route" />
          </span>
          <span className="text-[11px] font-medium text-text-dim">Mock data mode</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-faint">
          Not wired to the Control Plane API yet. Changes here stay in this
          browser until Phase 3 connects the real endpoint.
        </p>
      </div>
    </aside>
  );
}
