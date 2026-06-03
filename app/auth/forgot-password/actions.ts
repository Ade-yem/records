"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function requestPasswordReset(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const { error } = await auth.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
  if (error) return { error: error.message || "Could not send reset code. Please try again." };

  redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
}
