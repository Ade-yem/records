"use server";

import { redirect } from "next/navigation";

/**
 * Helper to build the Neon Auth base URL correctly.
 * Mirrors the SDK's own URL normalization to avoid double slashes.
 */
function getNeonAuthBaseUrl(): string {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is not configured");
  }
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export async function resetPassword(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email    = (formData.get("email") as string)?.trim().toLowerCase();
  const otp      = (formData.get("otp") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm  = formData.get("confirmPassword") as string;

  if (!email || !otp || !password || !confirm) return { error: "All fields are required." };
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) return { error: "Enter the 6-digit code from your email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };

  try {
    const baseUrl = getNeonAuthBaseUrl();
    
    /**
     * WORKAROUND: @neondatabase/auth@0.4.1-beta has a bug in the next/server adapter.
     * The auth.emailOtp.resetPassword() method is hardcoded to POST to "email-otp/passcode"
     * which doesn't exist on the backend. The correct endpoint is "email-otp/reset-password".
     * 
     * This directly calls the correct endpoint instead of using the broken SDK method.
     * Issue will be fixed in a future release. See: https://github.com/neondatabase/auth
     */
    const response = await fetch(`${baseUrl}/email-otp/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, password }),
    });

    if (!response.ok) {
      let errorMessage = "Invalid or expired code. Please try again.";
      
      try {
        const data = await response.json();
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } catch {
        // JSON parse failed, use default message
      }

      return { error: errorMessage };
    }

    // Success — redirect to sign-in
    redirect("/auth/sign-in?reset=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { error: message };
  }
}
