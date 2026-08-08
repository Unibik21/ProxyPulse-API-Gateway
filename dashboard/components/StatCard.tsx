export default function StatCard({
  label,
  value,
  accent = "text-text",
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-ink-border bg-ink-panel px-4 py-3 shadow-panel">
      <div className="text-[11px] font-medium uppercase tracking-wider text-text-faint">{label}</div>
      <div className={`mt-1 font-display text-[22px] font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
