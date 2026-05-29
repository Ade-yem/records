"use client";

import { useState, useActionState } from "react";
import { signInWithEmail } from "./actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { EyeIcon, EyeOffIcon } from "@/components/Icon";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-page">
      <main className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="auth-logo">SS</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>ShopSync</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Sign in to your shop ledger
          </p>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="email" className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="current-password"
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOffIcon size={18} aria-hidden /> : <EyeIcon size={18} aria-hidden />}
              </button>
            </div>
          </div>

          {state?.error ? <Alert variant="danger">{state.error}</Alert> : null}

          <Button type="submit" variant="primary" fullWidth loading={isPending} loadingText="Signing in…">
            Sign in
          </Button>

          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.25rem" }}>
            Don&apos;t have an account? Contact your administrator.
          </p>
        </form>
      </main>
    </div>
  );
}
