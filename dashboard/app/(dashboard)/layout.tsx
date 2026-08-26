"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { StoreProvider, useStore } from "@/lib/store";

function ProjectEntryGuard({ children }: { children: React.ReactNode }) {
  const { projects, loading, setActiveProject } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRole(data?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    if (loading || !role || projects.length === 0) return;
    if (role !== "admin" && pathname === "/projects") {
      setActiveProject(projects[0].id);
      router.replace("/services");
      return;
    }
    if (role === "admin" && projects.length === 0 && pathname !== "/projects") {
      router.replace("/projects");
    }
  }, [loading, pathname, projects, role, router, setActiveProject]);

  if (!loading && role !== "admin" && projects.length > 0 && pathname === "/projects") {
    return null;
  }
  if (!loading && role === "admin" && projects.length === 0 && pathname !== "/projects") {
    return null;
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
