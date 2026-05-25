interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonList({ rows = 4, rowHeight = 92 }: { rows?: number; rowHeight?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={rowHeight} radius={12} />
      ))}
    </div>
  );
}
