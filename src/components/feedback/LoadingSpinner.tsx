import React from "react";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 20, color = "var(--brass-500)" }: LoadingSpinnerProps) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      border: `2px solid var(--line-300)`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "sig-spin 700ms linear infinite",
      flexShrink: 0,
    }} />
  );
}
