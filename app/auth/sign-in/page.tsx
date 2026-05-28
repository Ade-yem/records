"use client";

import { useActionState } from "react";
import { signInWithEmail } from "./actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { InputField } from "@/components/FormField";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

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
          <InputField
            label="Email address"
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            autoComplete="email"
          />
          <InputField
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={isPending}
            autoComplete="current-password"
          />

          {state?.error ? <Alert variant="danger">{state.error}</Alert> : null}

          <Button type="submit" variant="primary" fullWidth loading={isPending} loadingText="Signing in…">
            Sign in
          </Button>
        </form>
      </main>
    </div>
  );
}
