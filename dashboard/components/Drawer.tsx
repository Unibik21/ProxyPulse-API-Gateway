"use client";

import { useEffect } from "react";

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-ink-border bg-ink-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-border px-5 py-4">
          <h2 className="font-display text-[14px] font-semibold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-text-dim hover:bg-ink-panel2 hover:text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
