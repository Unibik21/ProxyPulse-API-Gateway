"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionUser {
  name: string | null;
  email: string;
  role: "admin" | "developer";
  org: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as SessionUser;
        setUser(data);
        const projectsResponse = await fetch("/api/projects");
        if (projectsResponse.ok) setProjects(await projectsResponse.json());
      })
      .catch(() => {});
  }, []);

  const firstProject = projects[0];

  function openDeveloperDashboard() {
    if (firstProject) window.localStorage.setItem("activeProjectId", firstProject.id);
  }

  return (
    <main className="min-h-screen px-6 py-6 lg:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-ink-border pb-5">
        <div>
          <div className="font-display text-[16px] font-semibold tracking-tight text-text">Proxy Pulse</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-faint">API control plane</div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <span className="hidden rounded-md border border-ink-border bg-ink-panel px-3 py-2 text-[12px] text-text-dim sm:block">
              {user.name ?? user.email}
            </span>
          ) : (
            <>
              <Link href="/login" className="focus-ring rounded-md border border-ink-border px-3.5 py-2 text-[12px] font-medium text-text-dim hover:border-signal hover:text-text">Log in</Link>
              <Link href="/register" className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[12px] font-semibold text-ink hover:bg-signal/90">Create organization</Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.24em] text-signal">One calm place for your gateway</p>
          <h1 className="max-w-2xl font-display text-[clamp(38px,6vw,72px)] font-semibold leading-[0.98] tracking-tight text-text">Ship the API.<br /><span className="text-signal">Keep control.</span></h1>
          <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-text-dim">Configure services, routes, access keys, analytics, and project teams from one focused control plane.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {user?.role === "admin" ? (
              <Link href="/projects" className="focus-ring rounded-md bg-signal px-5 py-3 text-[13px] font-semibold text-ink hover:bg-signal/90">Go to project page <span className="ml-2">-&gt;</span></Link>
            ) : user?.role === "developer" && firstProject ? (
              <Link href="/services" onClick={openDeveloperDashboard} className="focus-ring rounded-md bg-signal px-5 py-3 text-[13px] font-semibold text-ink hover:bg-signal/90">Open dashboard <span className="ml-2">-&gt;</span></Link>
            ) : user ? (
              <span className="rounded-md border border-ink-border px-5 py-3 text-[13px] text-text-dim">No project access yet</span>
            ) : (
              <>
                <Link href="/register" className="focus-ring rounded-md bg-signal px-5 py-3 text-[13px] font-semibold text-ink hover:bg-signal/90">Create your organization <span className="ml-2">-&gt;</span></Link>
                <Link href="/login" className="focus-ring text-[13px] text-text-dim hover:text-signal">Already have an account?</Link>
              </>
            )}
          </div>
          {user && <p className="mt-4 font-mono text-[11px] text-text-faint">{user.org?.name ?? "Organization"} / {user.role}</p>}
        </div>

        <div className="relative rounded-xl border border-ink-border bg-ink-panel p-4 shadow-panel">
          <div className="rounded-lg border border-ink-border bg-ink p-5">
            <div className="mb-7 flex items-center justify-between border-b border-ink-border pb-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">Workspace / production</span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-signal"><span className="h-1.5 w-1.5 rounded-full bg-signal" /> connected</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-ink-border bg-ink-panel p-4"><p className="font-mono text-[10px] text-text-faint">SERVICES</p><p className="mt-3 font-display text-[28px] text-text">12</p></div>
              <div className="rounded-md border border-ink-border bg-ink-panel p-4"><p className="font-mono text-[10px] text-text-faint">ROUTES</p><p className="mt-3 font-display text-[28px] text-signal">48</p></div>
            </div>
            <div className="mt-3 rounded-md border border-ink-border bg-ink-panel p-4"><div className="flex items-center justify-between"><span className="font-mono text-[11px] text-text-dim">GET /v1/customers</span><span className="font-mono text-[10px] text-signal">healthy</span></div><div className="mt-4 h-1 rounded-full bg-ink-border"><div className="h-1 w-4/5 rounded-full bg-signal" /></div></div>
          </div>
        </div>
      </section>
    </main>
  );
}
