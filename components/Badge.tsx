import type { ReactNode } from "react";

type Variant = "neutral" | "success" | "danger" | "warning" | "info";

const VARIANT_CLASS: Record<Variant, string> = {
  neutral: "badge",
  success: "badge badge-success",
  danger: "badge badge-danger",
  warning: "badge badge-warning",
  info: "badge badge-info",
};

export function Badge({ variant = "neutral", children }: { variant?: Variant; children: ReactNode }) {
  return <span className={VARIANT_CLASS[variant]}>{children}</span>;
}
