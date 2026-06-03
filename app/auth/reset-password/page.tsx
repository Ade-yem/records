"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "./actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { EyeIcon, EyeOffIcon } from "@/components/Icon";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [state, formAction, isPending] = useActionState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!email) {
    return (
      <div className="auth-page">
        <main className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Missing email. Please start over.
          </p>
          <Link href="/auth/forgot-password" className="btn btn-primary">
            Request a reset code
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <main className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="auth-logo">SS</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Enter reset code</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            We sent a 6-digit code to{" "}
            <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
          </p>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* carry email through the form */}
          <input type="hidden" name="email" value={email} />

          <div>
            <label htmlFor="otp" className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
              6-digit code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="123456"
              required
              disabled={isPending}
              className="form-input"
              style={{ letterSpacing: "0.35em", fontSize: "1.5rem", textAlign: "center" }}
            />
          </div>

          <div>
            <label htmlFor="password" className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
              New password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                disabled={isPending}
                autoComplete="new-password"
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-muted)", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? <EyeOffIcon size={18} aria-hidden /> : <EyeIcon size={18} aria-hidden />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
              Confirm new password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className="form-input"
                placeholder="Repeat your new password"
                required
                minLength={8}
                disabled={isPending}
                autoComplete="new-password"
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-muted)", padding: 0,
                  display: "flex", alignItems: "center",
                }}
              >
                {showConfirm ? <EyeOffIcon size={18} aria-hidden /> : <EyeIcon size={18} aria-hidden />}
              </button>
            </div>
          </div>

          {state?.error ? <Alert variant="danger">{state.error}</Alert> : null}

          <Button type="submit" variant="primary" fullWidth loading={isPending} loadingText="Resetting…">
            Set new password
          </Button>

          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
            Didn&apos;t receive a code?{" "}
            <Link href="/auth/forgot-password" style={{ color: "var(--primary)" }}>
              Resend
            </Link>
            {" · "}
            <Link href="/auth/sign-in" style={{ color: "var(--primary)" }}>
              Back to sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><main className="auth-card" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
