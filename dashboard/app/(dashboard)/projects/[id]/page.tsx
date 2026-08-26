"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { inputClass } from "@/components/Field";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function ProjectMembersPage() {
  const { id } = useParams<{ id: string }>();
  const { projects } = useStore();
  const project = projects.find((item) => item.id === id);
  const [members, setMembers] = useState<Member[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [projectRes, membersRes] = await Promise.all([
      fetch(`/api/projects/${id}/members`),
      fetch("/api/members"),
    ]);
    if (projectRes.ok) setMembers(await projectRes.json());
    if (membersRes.ok) setOrganizationMembers(await membersRes.json());
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timeoutId = setTimeout(load, 0);
    return () => clearTimeout(timeoutId);
  }, [id, load]);

  const availableMembers = organizationMembers.filter(
    (member) => !members.some((projectMember) => projectMember.id === member.id)
  );

  async function addMember() {
    if (!selectedId) return;
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId: selectedId }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add member");
      return;
    }
    setSelectedId("");
    setError(null);
    load();
  }

  async function removeMember(member: Member) {
    const res = await fetch(`/api/projects/${id}/members?adminId=${member.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not remove member");
      return;
    }
    load();
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-[20px] font-semibold text-text">{project?.name ?? "Project"}</h1>
        <p className="mt-1 text-[13px] text-text-dim">Choose which organization members can access this project.</p>
      </header>

      {error && <p className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</p>}

      <div className="mb-5 flex max-w-xl gap-2">
        <select className={`${inputClass} flex-1`} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="">Select an organization member</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>{member.name ?? member.email} ({member.email})</option>
          ))}
        </select>
        <button onClick={addMember} disabled={!selectedId} className="rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink disabled:opacity-40">Add member</button>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead><tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint"><th className="px-4 py-2.5 font-medium">Name</th><th className="px-4 py-2.5 font-medium">Email</th><th className="px-4 py-2.5"></th></tr></thead>
          <tbody className="divide-y divide-ink-border">
            {members.map((member) => (
              <tr key={member.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5 font-medium">{member.name ?? "-"}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-text-dim">{member.email}</td>
                <td className="px-4 py-2.5 text-right"><button onClick={() => removeMember(member)} className="text-[12px] text-danger hover:underline">Remove</button></td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-[13px] text-text-faint">No members assigned to this project.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
