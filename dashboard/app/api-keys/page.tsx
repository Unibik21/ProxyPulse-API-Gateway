"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import Drawer from "@/components/Drawer";
import { Field, inputClass, selectClass } from "@/components/Field";
import StatCard from "@/components/StatCard";

function emptyDraft(defaultUserId: string) {
  return { label: "", user_id: defaultUserId, is_active: true };
}

function relativeTime(iso: string | null) {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ApiKeysPage() {
  const { apiKeys, users, addApiKey, updateApiKey, deleteApiKey } = useStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft(users[0]?.id ?? ""));

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? "— unknown —";

  function openCreate() {
    setDraft(emptyDraft(users[0]?.id ?? ""));
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.label.trim() || !draft.user_id) return;
    addApiKey(draft);
    setOpen(false);
  }

  const active = apiKeys.filter((k) => k.is_active).length;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-text">API keys</h1>
          <p className="mt-1 text-[13px] text-text-dim">
            Issued keys used to call the gateway. Full values are shown once, on creation, in the real API.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={users.length === 0}
          className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Issue key
        </button>
      </header>

      {users.length === 0 && (
        <div className="mb-5 rounded-md border border-route/30 bg-route/10 px-4 py-2.5 text-[13px] text-route">
          Add a user first — every key belongs to someone.
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard label="Total keys" value={apiKeys.length} />
        <StatCard label="Active" value={active} accent="text-signal" />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="px-4 py-2.5 font-medium">Label</th>
              <th className="px-4 py-2.5 font-medium">Key</th>
              <th className="px-4 py-2.5 font-medium">Owner</th>
              <th className="px-4 py-2.5 font-medium">Last used</th>
              <th className="px-4 py-2.5 font-medium">State</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {apiKeys.map((k) => (
              <tr key={k.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5 font-medium">{k.label}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-text-dim">{k.key_preview}</td>
                <td className="px-4 py-2.5 text-text-dim">{userName(k.user_id)}</td>
                <td className="px-4 py-2.5 text-text-faint">{relativeTime(k.last_used_at)}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => updateApiKey(k.id, { is_active: !k.is_active })}
                    className={`focus-ring rounded px-2 py-0.5 text-[11px] font-medium ${
                      k.is_active
                        ? "bg-signal/10 text-signal hover:bg-signal/20"
                        : "bg-ink-border/60 text-text-faint hover:bg-ink-border"
                    }`}
                  >
                    {k.is_active ? "Active" : "Revoked"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => {
                      if (confirm(`Delete key "${k.label}"? This can't be undone.`)) deleteApiKey(k.id);
                    }}
                    className="focus-ring text-[12px] text-danger hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {apiKeys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[13px] text-text-faint">
                  No keys issued yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Issue API key">
        <form onSubmit={submit}>
          <Field label="Label">
            <input
              className={inputClass}
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder="ci pipeline"
              required
            />
          </Field>
          <Field label="Owner">
            <select
              className={selectClass}
              value={draft.user_id}
              onChange={(e) => setDraft({ ...draft, user_id: e.target.value })}
              required
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            className="focus-ring mt-2 w-full rounded-md bg-signal py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90"
          >
            Issue key
          </button>
        </form>
      </Drawer>
    </div>
  );
}
