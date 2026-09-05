"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { HttpMethod, Route } from "@/lib/types";
import MethodBadge from "@/components/MethodBadge";
import PathChips from "@/components/PathChips";
import Drawer from "@/components/Drawer";
import { Field, inputClass, selectClass } from "@/components/Field";
import StatCard from "@/components/StatCard";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function emptyDraft(defaultServiceId: string) {
  return {
    path: "",
    method: "GET" as HttpMethod,
    service_id: defaultServiceId,
    rate_limit: null as number | null,
    cache_ttl: null as number | null,
    is_active: true,
  };
}

export default function RoutesPage() {
  const { routes, services, addRoute, updateRoute, deleteRoute } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft(services[0]?.id ?? ""));

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "— unknown —";

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft(services[0]?.id ?? ""));
    setOpen(true);
  }

  function openEdit(r: Route) {
    setEditingId(r.id);
    setDraft({
      path: r.path,
      method: r.method,
      service_id: r.service_id,
      rate_limit: r.rate_limit,
      cache_ttl: r.cache_ttl,
      is_active: r.is_active,
    });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.path.trim() || !draft.service_id) return;
    const normalizedPath = draft.path.startsWith("/") ? draft.path : `/${draft.path}`;
    const payload = { ...draft, path: normalizedPath };
    if (editingId) {
      updateRoute(editingId, payload);
    } else {
      addRoute(payload);
    }
    setOpen(false);
  }

  const active = routes.filter((r) => r.is_active).length;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-text">Routes</h1>
          <p className="mt-1 text-[13px] text-text-dim">
            Path + method combinations the gateway will match once Phase 3 wires this up.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={services.length === 0}
          className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add route
        </button>
      </header>

      {services.length === 0 && (
        <div className="mb-5 rounded-md border border-route/30 bg-route/10 px-4 py-2.5 text-[13px] text-route">
          Add a service first — every route needs somewhere to point.
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard label="Total routes" value={routes.length} />
        <StatCard label="Active" value={active} accent="text-signal" />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="px-4 py-2.5 font-medium">Method</th>
              <th className="px-4 py-2.5 font-medium">Path</th>
              <th className="px-4 py-2.5 font-medium">Service</th>
              <th className="px-4 py-2.5 font-medium">Rate limit</th>
              <th className="px-4 py-2.5 font-medium">Cache TTL</th>
              <th className="px-4 py-2.5 font-medium">State</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {routes.map((r) => (
              <tr key={r.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5">
                  <MethodBadge method={r.method} />
                </td>
                <td className="px-4 py-2.5">
                  <PathChips path={r.path} />
                </td>
                <td className="px-4 py-2.5 text-text-dim">{serviceName(r.service_id)}</td>
                <td className="px-4 py-2.5 text-text-dim">
                  {r.rate_limit === null ? "Default (100/min)" : `${r.rate_limit}/min`}
                </td>
                <td className="px-4 py-2.5 text-text-dim">
                  {r.cache_ttl === null ? "Off" : `${r.cache_ttl}s`}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => updateRoute(r.id, { is_active: !r.is_active })}
                    className={`focus-ring rounded px-2 py-0.5 text-[11px] font-medium ${
                      r.is_active
                        ? "bg-signal/10 text-signal hover:bg-signal/20"
                        : "bg-ink-border/60 text-text-faint hover:bg-ink-border"
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => openEdit(r)}
                    className="focus-ring mr-3 text-[12px] text-wire hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove route ${r.method} ${r.path}?`)) deleteRoute(r.id);
                    }}
                    className="focus-ring text-[12px] text-danger hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-text-faint">
                  No routes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={editingId ? "Edit route" : "Add route"}>
        <form onSubmit={submit}>
          <Field label="Method">
            <select
              className={selectClass}
              value={draft.method}
              onChange={(e) => setDraft({ ...draft, method: e.target.value as HttpMethod })}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Path">
            <input
              className={inputClass + " font-mono"}
              value={draft.path}
              onChange={(e) => setDraft({ ...draft, path: e.target.value })}
              placeholder="/api/users/:id"
              required
            />
          </Field>
          <Field label="Service">
            <select
              className={selectClass}
              value={draft.service_id}
              onChange={(e) => setDraft({ ...draft, service_id: e.target.value })}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rate limit (requests per minute)">
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={draft.rate_limit ?? ""}
              onChange={(e) => setDraft({ ...draft, rate_limit: e.target.value ? Number(e.target.value) : null })}
              placeholder="Default: 100/min"
            />
          </Field>
          <Field label="Cache TTL (seconds)">
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={draft.cache_ttl ?? ""}
              onChange={(e) => setDraft({ ...draft, cache_ttl: e.target.value ? Number(e.target.value) : null })}
              placeholder="Disabled"
            />
          </Field>
          <Field label="State">
            <label className="flex items-center gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-ink-border2 bg-ink accent-signal"
              />
              Active
            </label>
          </Field>
          <button
            type="submit"
            className="focus-ring mt-2 w-full rounded-md bg-signal py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90"
          >
            {editingId ? "Save changes" : "Add route"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
