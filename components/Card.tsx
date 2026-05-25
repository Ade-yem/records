import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className, style, ...rest }: CardProps) {
  const cls = ["card", className ?? ""].filter(Boolean).join(" ");
  const mergedStyle: CSSProperties = padded ? (style ?? {}) : { padding: 0, ...style };
  return (
    <div className={cls} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
}
