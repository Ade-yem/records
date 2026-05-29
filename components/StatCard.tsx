import type { KeyboardEvent, ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({ label, value, tone = "neutral", onClick, active }: StatCardProps) {
  const handleKeyDown = onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <div
      className={["stat-card", onClick ? "stat-card-interactive" : "", active ? "stat-card-active" : ""].filter(Boolean).join(" ")}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-pressed={onClick ? active : undefined}
    >
      <div className="label">{label}</div>
      <div className={`value ${TONE_CLASS[tone]}`.trim()}>{value}</div>
    </div>
  );
}
