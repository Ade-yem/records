import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className, style, onClick, ...rest }: CardProps) {
  const cls = ["card", className ?? ""].filter(Boolean).join(" ");
  const mergedStyle: CSSProperties = padded ? (style ?? {}) : { padding: 0, ...style };

  const handleKeyDown = onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }
    : undefined;

  return (
    <div
      className={cls}
      style={mergedStyle}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}
