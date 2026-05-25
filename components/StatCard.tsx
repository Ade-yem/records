import type { ReactNode } from "react";

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
}

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className={`value ${TONE_CLASS[tone]}`.trim()}>{value}</div>
    </div>
  );
}
