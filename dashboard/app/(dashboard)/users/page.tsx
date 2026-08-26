"use client";

import { useEffect, useState } from "react";
import Drawer from "@/components/Drawer";
import { Field, inputClass, selectClass } from "@/components/Field";
import StatCard from "@/components/StatCard";
import { useStore } from "@/lib/store";

type OrgRole = "admin" | "developer";

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: OrgRole;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: OrgRole;
  createdAt: string;
  expiresAt: string;
}

const ROLE_STYLES: Record<OrgRole, string> = {
  admin: "bg-plum/10 text-plum",
  developer: "bg-wire/10 text-wire",
};

export default function UsersPage() {
  const { projects } = useStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [myRole, setMyRole] = useState<OrgRole | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("developer");
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const isAdmin = myRole === "admin";

  async function load() {
    setLoadingList(true);
    try {
      const [meRes, membersRes, invitesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/members"),
        fetch("/api/invitations"),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setMyRole(me.role ?? null);
        setMyId(me.adminId ?? null);
      }
      if (membersRes.ok) setMembers(await membersRes.json());
      if (invitesRes.ok) setInvites(await invitesRes.json());
    } catch {
      setError("Failed to load members");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteResult(null);
    setInviteUrl(null);
    setInviting(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, projectId: inviteProjectId || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInviteResult(data.error ?? "Could not create invitation");
        return;
      }

      setInviteResult(
        data.emailSent
          ? `Invitation emailed to ${data.email}`
          : `Invitation created — SMTP is not configured, share the link below`
      );
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);
      setInviteEmail("");
      setInviteProjectId("");
      load();
    } catch {
      setInviteResult("Network error — please try again");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(member: Member, role: OrgRole) {
    const res = await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) load();
    else setError((await res.json()).error ?? "Could not change role");
  }

  async function removeMember(member: Member) {
    if (!confirm(`Remove ${member.name ?? member.email} from the organization?`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError((await res.json()).error ?? "Could not remove member");
  }

  async function revokeInvite(invite: PendingInvite) {
    if (!confirm(`Revoke the invitation for ${invite.email}?`)) return;
    const res = await fetch(`/api/invitations/${invite.id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError((await res.json()).error ?? "Could not revoke invitation");
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-text">Members</h1>
          <p className="mt-1 text-[13px] text-text-dim">
            People with dashboard access to this organization.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setOpen(true)}
            className="focus-ring rounded-md bg-signal px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-signal/90"
          >
            Invite member
          </button>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Members" value={members.length} />
        <StatCard label="Admins" value={members.filter((m) => m.role === "admin").length} accent="text-plum" />
        <StatCard label="Pending invites" value={invites.length} accent="text-wire" />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-border bg-ink-panel shadow-panel">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-border text-[11px] uppercase tracking-wider text-text-faint">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
              {isAdmin && <th className="px-4 py-2.5"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-border">
            {members.map((m) => (
              <tr key={m.id} className="text-[13px] text-text">
                <td className="px-4 py-2.5 font-medium">
                  {m.name ?? "—"}
                  {m.id === myId && (
                    <span className="ml-2 rounded bg-ink-border/60 px-1.5 py-0.5 text-[10px] text-text-dim">
                      you
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-text-dim">{m.email}</td>
                <td className="px-4 py-2.5">
                  {isAdmin && m.id !== myId ? (
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value as OrgRole)}
                      className="rounded border border-ink-border bg-ink px-1.5 py-0.5 text-[11px] font-medium text-text outline-none focus:border-signal"
                    >
                      <option value="developer">developer</option>
                    </select>
                  ) : (
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${ROLE_STYLES[m.role]}`}>
                      {m.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-text-faint">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    {m.id !== myId && (
                      <button
                        onClick={() => removeMember(m)}
                        className="focus-ring text-[12px] text-danger hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}

            {invites.map((i) => (
              <tr key={i.id} className="text-[13px] text-text-faint">
                <td className="px-4 py-2.5 italic">Invited</td>
                <td className="px-4 py-2.5 font-mono text-[12px]">{i.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${ROLE_STYLES[i.role]}`}>
                    {i.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[12px]">
                  expires {new Date(i.expiresAt).toLocaleDateString()}
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => revokeInvite(i)}
                      className="focus-ring text-[12px] text-danger hover:underline"
                    >
                      Revoke
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {!loadingList && members.length === 0 && invites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-text-faint">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Invite member">
        <form onSubmit={sendInvite}>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
            />
          </Field>
          <Field label="Role">
            <select
              className={selectClass}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
            >
              <option value="developer">developer — can view analytics, manage services & routes</option>
            </select>
          </Field>
          <Field label="Project access">
            <select className={selectClass} value={inviteProjectId} onChange={(e) => setInviteProjectId(e.target.value)} required>
              <option value="">Choose a project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </Field>

          {inviteResult && (
            <p className="mb-3 rounded-md border border-signal/30 bg-signal/10 px-3 py-2 text-[12px] text-signal">
              {inviteResult}
            </p>
          )}
          {inviteUrl && (
            <div className="mb-3 rounded-md border border-ink-border bg-ink px-3 py-2">
              <p className="mb-1 text-[11px] text-text-dim">Invitation link (share manually):</p>
              <p className="break-all font-mono text-[11px] text-text">{inviteUrl}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="focus-ring mt-2 w-full rounded-md bg-signal py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90 disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
