"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InviteInfo {
  email: string;
  role: "admin" | "developer";
  org: { id: string; name: string; slug: string };
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? "Invalid invitation");
          return;
        }
        setInvite(data);
      })
      .catch(() => setError("Network error — please try again"));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setError(null);

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not accept invitation");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal";
  const labelClass = "mb-1.5 block text-[12px] font-medium text-text-dim";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="font-display text-[22px] font-semibold tracking-tight text-text">
          Control Plane
        </div>
        <div className="mt-1 font-mono text-[11px] text-text-faint">accept invitation</div>
      </div>

      <div className="rounded-xl border border-ink-border bg-ink-panel px-7 py-8 shadow-panel">
        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        {!invite && (
          <p className="py-4 text-center text-[13px] text-text-faint">Loading invitation…</p>
        )}

        {invite && (
          <>
            <h1 className="mb-1 font-display text-[16px] font-semibold text-text">
              Join {invite.org.name}
            </h1>
            <p className="mb-6 text-[12px] text-text-dim">
              You&apos;re joining as{" "}
              <span className="font-semibold text-signal">{invite.role}</span>. Set a
              password to finish.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="min 8 characters"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-md bg-signal px-4 py-2.5 font-display text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Joining…" : "Join invitation"}
              </button>
            </form>
          </>
        )}

        {!invite && (
          <p className="text-center text-[12px] text-text-faint">
            Invalid or expired invitation.{" "}
            <Link href="/login" className="text-signal hover:underline">
              Go to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}