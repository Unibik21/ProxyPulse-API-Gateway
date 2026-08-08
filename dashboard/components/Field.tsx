export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[12px] font-medium text-text-dim">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring w-full rounded-md border border-ink-border2 bg-ink px-3 py-2 text-[13px] text-text placeholder:text-text-faint";

export const selectClass = inputClass + " appearance-none";
