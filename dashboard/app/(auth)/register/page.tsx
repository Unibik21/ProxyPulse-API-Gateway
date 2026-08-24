"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [orgName,    setOrgName]    = useState("");
  const [adminName,  setAdminName]  = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [password2,  setPassword2]  = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orgName, adminName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
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

  return (
    <div className="w-full max-w-sm">
      {/* Logo / title */}
      <div className="mb-8 text-center">
        <div className="font-display text-[22px] font-semibold tracking-tight text-text">
          Control Plane
        </div>
        <div className="mt-1 font-mono text-[11px] text-text-faint">create your organization</div>
      </div>

      <div className="rounded-xl border border-ink-border bg-ink-panel px-7 py-8 shadow-panel">
        <h1 className="mb-6 font-display text-[16px] font-semibold text-text">
          New organization
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-dim">
              Organization name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-dim">
              Your name
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-dim">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-dim">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal"
              placeholder="min 8 characters"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-text-dim">
              Confirm password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal"
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
            {loading ? "Creating…" : "Create organization"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-text-faint">
          Already have an account?{" "}
          <Link href="/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
