import type { ReactNode } from "react";
import type { IconComponent } from "./Icon";

interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background: "white",
        borderRadius: 12,
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: "0 auto 1rem",
          borderRadius: "50%",
          background: "var(--primary-soft)",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={32} aria-hidden />
      </div>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      {description ? <p style={{ color: "var(--text-muted)" }}>{description}</p> : null}
      {action ? <div style={{ marginTop: "1.25rem" }}>{action}</div> : null}
    </div>
  );
}
