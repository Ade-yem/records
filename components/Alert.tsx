import type { ReactNode } from "react";
import { AlertIcon, CheckIcon, ErrorIcon, InfoIcon } from "./Icon";

type Variant = "success" | "danger" | "warning" | "info";

interface AlertProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

const STYLES: Record<Variant, { bg: string; fg: string; border: string }> = {
  success: { bg: "#F0FDF4", fg: "#166534", border: "#BBF7D0" },
  danger: { bg: "#FFF5F5", fg: "#9B2C2C", border: "#FED7D7" },
  warning: { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A" },
  info: { bg: "var(--primary-soft)", fg: "var(--primary)", border: "#BEE3F8" },
};

const ICONS = {
  success: CheckIcon,
  danger: ErrorIcon,
  warning: AlertIcon,
  info: InfoIcon,
} as const;

export function Alert({ variant = "info", title, children }: AlertProps) {
  const s = STYLES[variant];
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "0.75rem 1rem",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        fontSize: "0.88rem",
        fontWeight: 500,
      }}
    >
      <Icon size={18} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {title ? <div style={{ fontWeight: 700, marginBottom: 2 }}>{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
