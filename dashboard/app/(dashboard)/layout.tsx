"use client";

import Sidebar from "@/components/Sidebar";
import { StoreProvider } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
      </div>
    </StoreProvider>
  );
}
