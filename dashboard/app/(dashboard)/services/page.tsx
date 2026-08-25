"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Service, ServiceStatus } from "@/lib/types";
import StatusDot from "@/components/StatusDot";
import Drawer from "@/components/Drawer";
import { Field, inputClass, selectClass } from "@/components/Field";
import StatCard from "@/components/StatCard";

const STATUS_OPTIONS: ServiceStatus[] = ["healthy", "degraded", "down"];

function emptyDraft() {
  return { name: "", base_url: "", status: "healthy" as ServiceStatus };
}

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(s: Service) {
    setEditingId(s.id);
    setDraft({ name: s.name, base_url: s.base_url, status: s.status });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.base_url.trim()) return;
    if (editingId) {
      updateService(editingId, draft);
    } else {
      addService(draft);
    }
    setOpen(false);
  }

  const healthy = services.filter((s) => s.status === "healthy").length;
  const down = services.filter((s) => s.status === "down").length;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-text">Services</h1>
          <p className="mt-1 text-[13px] text-text-dim">
            Downstream microservices the gateway can proxy to.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-signal/90"
        >
          Add service
        </button>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={services.length} />
        <StatCard label="Healthy" value={healthy} accent="text-signal" />
        <StatCard label="Down" value={down} accent={down ? "text-danger" : "text-text"} />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Base URL</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {services.map((s) => (
              <tr key={s.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-text-dim">{s.base_url}</td>
                <td className="px-4 py-2.5">
                  <StatusDot status={s.status} />
                </td>
                <td className="px-4 py-2.5 text-text-faint">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => openEdit(s)}
                    className="focus-ring mr-3 text-[12px] text-wire hover:underline"
                    >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${s.name}? Routes pointing at it will be removed too.`)) {
                        deleteService(s.id);
                      }
                    }}
                    className="focus-ring text-[12px] text-danger hover:underline"
                    >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-text-faint">
                  No services yet. Add one to give the gateway somewhere to proxy to.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={editingId ? "Edit service" : "Add service"}>
        <form onSubmit={submit}>
          <Field label="Name">
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="users-service"
              required
            />
          </Field>
          <Field label="Base URL">
            <input
              className={inputClass + " font-mono"}
              value={draft.base_url}
              onChange={(e) => setDraft({ ...draft, base_url: e.target.value })}
              placeholder="http://localhost:4001"
              required
            />
          </Field>
          <Field label="Status">
            <select
              className={selectClass}
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as ServiceStatus })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            disabled={editingId && draft.name.trim() === "" || draft.base_url.trim() === ""}
            className="focus-ring mt-2 w-full rounded-md bg-signal py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90 disabled:opacity-50"
          >
            {editingId ? "Save changes" : "Add service"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}