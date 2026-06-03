"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { InputField } from "@/components/FormField";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <div className="auth-page">
      <main className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="auth-logo">SS</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Reset password</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Enter your email and we&apos;ll send a 6-digit code.
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

          {state?.error ? <Alert variant="danger">{state.error}</Alert> : null}

          <Button type="submit" variant="primary" fullWidth loading={isPending} loadingText="Sending…">
            Send reset code
          </Button>

          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
            <Link href="/auth/sign-in" style={{ color: "var(--primary)" }}>
              Back to sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
