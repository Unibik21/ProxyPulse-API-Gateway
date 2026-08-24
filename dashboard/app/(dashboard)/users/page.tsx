"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { User, UserRole } from "@/lib/types";
import Drawer from "@/components/Drawer";
import { Field, inputClass, selectClass } from "@/components/Field";
import StatCard from "@/components/StatCard";

const ROLES: UserRole[] = ["admin", "developer", "viewer"];

const ROLE_STYLES: Record<UserRole, string> = {
  admin: "bg-plum/10 text-plum",
  developer: "bg-wire/10 text-wire",
  viewer: "bg-ink-border/60 text-text-dim",
};

function emptyDraft() {
  return { name: "", email: "", role: "developer" as UserRole };
}

export default function UsersPage() {
  const { users, apiKeys, addUser, updateUser, deleteUser } = useStore();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setDraft({ name: u.name, email: u.email, role: u.role });
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;
    if (editingId) {
      updateUser(editingId, draft);
    } else {
      addUser(draft);
    }
    setOpen(false);
  }

  const keyCount = (userId: string) => apiKeys.filter((k) => k.user_id === userId).length;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-text">Users</h1>
          <p className="mt-1 text-[13px] text-text-dim">People who can manage or call the gateway.</p>
        </div>
        <button
          onClick={openCreate}
          className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-signal/90"
        >
          Add user
        </button>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={users.length} />
        <StatCard label="Admins" value={users.filter((u) => u.role === "admin").length} accent="text-plum" />
        <StatCard label="Developers" value={users.filter((u) => u.role === "developer").length} accent="text-wire" />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Keys</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {users.map((u) => (
              <tr key={u.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-text-dim">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${ROLE_STYLES[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-text-dim">{keyCount(u.id)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => openEdit(u)}
                    className="focus-ring mr-3 text-[12px] text-wire hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${u.name}? Their API keys will be removed too.`)) deleteUser(u.id);
                    }}
                    className="focus-ring text-[12px] text-danger hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-text-faint">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={editingId ? "Edit user" : "Add user"}>
        <form onSubmit={submit}>
          <Field label="Name">
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Priya Nair"
              required
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="priya@edgeworks.dev"
              required
            />
          </Field>
          <Field label="Role">
            <select
              className={selectClass}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            className="focus-ring mt-2 w-full rounded-md bg-signal py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90"
          >
            {editingId ? "Save changes" : "Add user"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
