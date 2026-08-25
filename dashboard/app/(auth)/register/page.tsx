"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type View = "org" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [view, setView] = useState<View>("org");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Org registration fields
  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // OTP verification
  const [verifyOtp, setVerifyOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  // Dev-only: code returned by the API when SMTP isn't configured
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function sendVerificationCode(targetEmail: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/register-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not send verification code");
        return false;
      }

      setResendIn(60);
      setDevCode(data.devCode ?? null);
      if (data.devCode) setVerifyOtp(data.devCode);
      return true;
    } catch {
      setError("Network error — please try again");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submitOrgForm(e: FormEvent) {
    e.preventDefault();

    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const ok = await sendVerificationCode(email);
    if (ok) setView("verify");
  }

  async function submitVerifyForm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, adminName, email, password, otp: verifyOtp }),
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

  async function resendCode() {
    await sendVerificationCode(email);
  }

  const inputClass =
    "w-full rounded-md border border-ink-border bg-ink px-3 py-2 font-mono text-[13px] text-text placeholder-text-faint outline-none focus:border-signal focus:ring-1 focus:ring-signal";
  const labelClass = "mb-1.5 block text-[12px] font-medium text-text-dim";

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
          {view === "org" ? "New organization" : "Verify your email"}
        </h1>

        {view === "org" && (
          <form onSubmit={submitOrgForm} className="space-y-4">
            <div>
              <label className={labelClass}>Organization name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputClass}
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label className={labelClass}>Your name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
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
              {loading ? "Sending code…" : "Send verification code"}
            </button>
          </form>
        )}

        {view === "verify" && (
          <form onSubmit={submitVerifyForm} className="space-y-4">
            <div>
              <label className={labelClass}>Verification code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center text-lg tracking-[0.4em]`}
                placeholder="123456"
              />
              <p className="mt-1.5 text-[11px] text-text-faint">
                We sent a 6-digit code to <span className="text-text-dim">{email}</span>.
                It expires in 5 minutes.
              </p>

              {devCode && (
                <div className="mt-3 rounded-md border border-signal/30 bg-signal/10 p-3">
                  <p className="mb-1 text-[11px] text-text-dim">
                    SMTP is not configured, so here is your code (dev mode):
                  </p>
                  <div className="text-center font-mono text-xl font-bold tracking-[0.3em] text-signal">
                    {devCode}
                  </div>
                </div>
              )}
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
              {loading ? "Creating…" : "Verify & create organization"}
            </button>

            <button
              type="button"
              disabled={resendIn > 0 || loading}
              onClick={resendCode}
              className="w-full text-center text-[12px] text-signal hover:underline disabled:text-text-faint disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => { setView("org"); setError(null); setDevCode(null); }}
              className="w-full text-center text-[12px] text-text-faint hover:text-text-dim"
            >
              ← Back to edit details
            </button>
          </form>
        )}

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
