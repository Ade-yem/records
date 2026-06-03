"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

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

  const { error } = await auth.emailOtp.resetPassword({ email, otp, password });
  if (error) return { error: error.message || "Invalid or expired code. Please try again." };

  redirect("/auth/sign-in?reset=1");
}
