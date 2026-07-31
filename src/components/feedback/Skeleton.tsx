import React from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 14, radius = "var(--radius-sm)", style = {} }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, var(--paper-200), var(--paper-300), var(--paper-200))",
        backgroundSize: "200% 100%",
        animation: "sig-skeleton 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: rows }, (_, idx) => (
        <div key={idx} style={{ padding: 18, border: "1px solid var(--line-200)", borderRadius: "var(--radius-lg)", background: "var(--paper-50)" }}>
          <Skeleton width="36%" height={16} />
          <Skeleton width="70%" height={12} style={{ marginTop: 10 }} />
          <Skeleton width="52%" height={12} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
