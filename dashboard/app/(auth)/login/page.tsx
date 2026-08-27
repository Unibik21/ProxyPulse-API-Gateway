"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

type AuthView = "password" | "otp" | "reset";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/";
  const oauthError   = searchParams.get("error");

  const [view,     setView]     = useState<AuthView>("password");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");
  const [error,    setError]    = useState<string | null>(oauthError);
  const [loading,  setLoading]  = useState(false);
  const [otpSent,  setOtpSent]  = useState(false);
  const [resendIn, setResendIn] = useState(0);
  // Dev-only: code returned by the API when SMTP isn't configured
  const [devCode, setDevCode]   = useState<string | null>(null);

  // Password-reset state
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Countdown for OTP resend cooldown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function clearOtpState() {
    setOtp("");
    setOtpSent(false);
    setDevCode(null);
    setError(null);
  }

  async function signInWithPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp(e: FormEvent, withoutPassword = false) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.resendAvailableInSeconds) {
          setResendIn(data.resendAvailableInSeconds);
          setError("A code was recently sent. Check your email or wait to resend.");
        } else if (data.error === 'No account found with that email') {
          setError("No account with that email — please create an organization first");
        } else {
          setError(data.error ?? "Could not send OTP");
        }
        return;
      }

      setOtpSent(true);
      setResendIn(60);
      setDevCode(data.devCode ?? null);
      if (data.devCode) setOtp(data.devCode);
      if (withoutPassword) setView("reset");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsRegistration) {
          router.push(`/register?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(data.error ?? "OTP verification failed");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== newPassword2) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Password reset failed");
        return;
      }

      setResetSuccess(true);
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
      {/* Logo / title */}
      <div className="mb-8 text-center">
        <div className="font-display text-[22px] font-semibold tracking-tight text-text">
          Proxy Pulse
        </div>
        <div className="mt-1 font-mono text-[11px] text-text-faint">admin console</div>
      </div>

      <div className="rounded-xl border border-ink-border bg-ink-panel px-7 py-8 shadow-panel">
        <h1 className="mb-6 font-display text-[16px] font-semibold text-text">
          {view === "reset" ? "Reset your password" : "Sign in"}
        </h1>

        {/* ── OAuth buttons ─────────────────────────────── */}
        {view !== "reset" && (
          <div className="space-y-2">
            {/* Plain <a> tags — full page navigation, no RSC fetch error */}
            <a
              href={`/api/auth/oauth/google/start?next=${encodeURIComponent(next)}`}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-border bg-ink px-4 py-2.5 text-[13px] font-medium text-text transition-colors hover:border-signal"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88L5.84 14.1Z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9c.87-2.6 3.3-4.52 6.16-4.52Z"/>
              </svg>
              Continue with Google
            </a>

            <a
              href={`/api/auth/oauth/github/start?next=${encodeURIComponent(next)}`}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-border bg-ink px-4 py-2.5 text-[13px] font-medium text-text transition-colors hover:border-signal"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.28.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
              </svg>
              Continue with GitHub
            </a>
          </div>
        )}

        {view !== "reset" && (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink-border" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">
                or
              </span>
              <div className="h-px flex-1 bg-ink-border" />
            </div>

            {/* ── View toggle ───────────────────────────────── */}
            <div className="mb-5 grid grid-cols-2 rounded-md border border-ink-border bg-ink p-0.5">
              <button
                type="button"
                onClick={() => { setView("password"); clearOtpState(); }}
                className={`rounded px-2 py-1.5 text-[12px] font-medium transition-colors ${
                  view === "password" ? "bg-signal text-ink" : "text-text-dim hover:text-text"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setView("otp"); clearOtpState(); }}
                className={`rounded px-2 py-1.5 text-[12px] font-medium transition-colors ${
                  view === "otp" ? "bg-signal text-ink" : "text-text-dim hover:text-text"
                }`}
              >
                Email code
              </button>
            </div>
          </>
        )}

        {/* ── Password form ─────────────────────────────── */}
        {view === "password" && (
          <form onSubmit={signInWithPassword} className="space-y-4">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <p className="text-right -mt-2 text-[12px]">
              <button
                type="button"
                onClick={() => { setView("reset"); clearOtpState(); }}
                className="text-text-faint hover:text-signal hover:underline"
              >
                Forgot your password?
              </button>
            </p>

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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        )}

        {/* ── OTP / Reset password form ─────────────────── */}
        {view === "otp" && (
          <form onSubmit={otpSent ? signInWithOtp : (e) => requestOtp(e, false)} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearOtpState();
                }}
                className={inputClass}
                placeholder="you@example.com"
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div>
                <label className={labelClass}>Verification code</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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
            )}

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
              {loading
                ? otpSent ? "Verifying…" : "Sending code…"
                : otpSent ? "Verify & sign in" : "Send code"}
            </button>

            {otpSent && (
              <button
                type="button"
                disabled={resendIn > 0 || loading}
                onClick={(e) => requestOtp(e, false)}
                className="w-full text-center text-[12px] text-signal hover:underline disabled:text-text-faint disabled:no-underline"
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            )}
          </form>
        )}

        {/* ── Password reset form ──────────────────────── */}
        {view === "reset" && (
          <form onSubmit={resetPassword} className="space-y-4">
            {resetSuccess ? (
              <div className="space-y-4">
                <p className="rounded-md border border-signal/30 bg-signal/10 px-3 py-2 text-[12px] text-signal">
                  Password updated! You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => { setView("password"); clearOtpState(); setResetSuccess(false); setNewPassword(""); setNewPassword2(""); }}
                  className="w-full rounded-md bg-signal px-4 py-2.5 font-display text-[13px] font-semibold text-ink transition-opacity hover:opacity-90"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {!otpSent ? (
                  <>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearOtpState(); }}
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </div>

                    {error && (
                      <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                        {error}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={(e) => requestOtp(e, true)}
                      disabled={loading}
                      className="mt-1 w-full rounded-md bg-signal px-4 py-2.5 font-display text-[13px] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "Sending…" : "Send reset code"}
                    </button>

                    <p className="text-center text-[12px] text-text-faint">
                      Remember your password?{" "}
                      <button type="button" onClick={() => { setView("password"); clearOtpState(); setError(null); }} className="text-signal hover:underline">
                        Sign in
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelClass}>Verification code</label>
                      <input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className={`${inputClass} text-center text-lg tracking-[0.4em]`}
                        placeholder="123456"
                      />
                      <p className="mt-1.5 text-[11px] text-text-faint">
                        Sent to <span className="text-text-dim">{email}</span>. Expires in 5 minutes.
                      </p>

                      {devCode && (
                        <div className="mt-3 rounded-md border border-signal/10 bg-signal/10 p-3">
                          <p className="mb-1 text-[11px] text-text-dim">Dev code:</p>
                          <div className="text-center font-mono text-xl font-bold tracking-[0.3em] text-signal">
                            {devCode}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>New password</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder="min 8 characters"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Confirm new password</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword2}
                        onChange={(e) => setNewPassword2(e.target.value)}
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
                      {loading ? "Resetting…" : "Reset password"}
                    </button>

                    <button
                      type="button"
                      disabled={resendIn > 0 || loading}
                      onClick={(e) => requestOtp(e, true)}
                      className="w-full text-center text-[12px] text-signal hover:underline disabled:text-text-faint disabled:no-underline"
                    >
                      {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                    </button>

                    <p className="text-center text-[12px] text-text-faint">
                      Remember your password?{" "}
                      <button type="button" onClick={() => { setView("password"); clearOtpState(); setError(null); setNewPassword(""); setNewPassword2(""); }} className="text-signal hover:underline">
                        Sign in
                      </button>
                    </p>
                  </>
                )}
              </>
            )}
          </form>
        )}

        {view !== "reset" && (
          <p className="mt-5 text-center text-[12px] text-text-faint">
            No account?{" "}
            <Link href="/register" className="text-signal hover:underline">
              Create an organization
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
