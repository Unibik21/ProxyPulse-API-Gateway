"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { StoreProvider, useStore } from "@/lib/store";

function ProjectEntryGuard({ children }: { children: React.ReactNode }) {
  const { projects, loading } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [permissionNoticeDismissed, setPermissionNoticeDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRole(data?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    if (loading || !role || projects.length === 0) return;
    if (role === "admin" && projects.length === 0 && pathname !== "/projects") {
      router.replace("/projects");
    }
  }, [loading, pathname, projects, role, router]);

  if (!loading && role !== "admin" && pathname === "/projects" && !permissionNoticeDismissed) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-ink px-6">
        <section className="w-full max-w-md rounded-xl border border-ink-border bg-ink-panel p-8 text-center shadow-panel">
          <button
            type="button"
            onClick={() => setPermissionNoticeDismissed(true)}
            aria-label="Close permission notice"
            className="focus-ring absolute right-8 top-8 font-mono text-[18px] leading-none text-text-faint hover:text-text"
          >
            x
          </button>
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-[22px] text-danger">!</div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-danger">Permission denied</p>
          <h1 className="font-display text-[21px] font-semibold text-text">Admin access only</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-text-dim">
            Project creation and management are available only to organization admins.
          </p>
          <Link href="/" className="focus-ring mt-6 inline-flex rounded-md border border-ink-border px-4 py-2.5 text-[13px] font-medium text-text-dim hover:border-signal hover:text-text">
            Return home
          </Link>
        </section>
      </main>
    );
  }
  if (!loading && role === "admin" && projects.length === 0 && pathname !== "/projects") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6">
        <section className="w-full max-w-md rounded-xl border border-ink-border bg-ink-panel p-8 text-center shadow-panel">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-signal/30 bg-signal/10 text-[22px] text-signal">!</div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">Project required</p>
          <h1 className="font-display text-[21px] font-semibold text-text">Create a project first</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-text-dim">
            Services, routes, API keys, and analytics belong to a project. Create your first project to open the dashboard.
          </p>
          <Link href="/projects" className="focus-ring mt-6 inline-flex rounded-md bg-signal px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90">
            Go to project page -&gt;
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ProjectEntryGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
        </div>
      </ProjectEntryGuard>
    </StoreProvider>
  );
}
