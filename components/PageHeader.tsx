import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

export function PageHeader({ title, description, actions, aside }: PageHeaderProps) {
  return (
    <header
      className="page-header"
      style={{ flexWrap: "wrap", gap: "1rem", rowGap: "0.75rem" }}
    >
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {description ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{description}</p>
        ) : null}
      </div>
      {aside ? <div>{aside}</div> : null}
      {actions ? <div style={{ display: "flex", gap: "0.5rem" }}>{actions}</div> : null}
    </header>
  );
}
