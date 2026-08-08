import { ServiceStatus } from "@/lib/types";

const STYLES: Record<ServiceStatus, { dot: string; text: string; label: string }> = {
  healthy: { dot: "bg-signal", text: "text-signal", label: "Healthy" },
  degraded: { dot: "bg-warn", text: "text-warn", label: "Degraded" },
  down: { dot: "bg-danger", text: "text-danger", label: "Down" },
};

export default function StatusDot({ status }: { status: ServiceStatus }) {
  const s = STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        {status === "healthy" && (
          <span className={`absolute inline-flex h-full w-full animate-pulse-ring rounded-full ${s.dot}`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      <span className={`text-[12px] font-medium ${s.text}`}>{s.label}</span>
    </span>
  );
}
