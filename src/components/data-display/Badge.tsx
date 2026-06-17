import React from "react";

interface BadgeProps {
  tone?: "neutral" | "blue" | "gold" | "success" | "danger" | "warning";
  dot?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ tone = "neutral", dot = false, children, style = {} }: BadgeProps) {
  const tones = {
    neutral: { bg: "var(--paper-200)", fg: "var(--slate-700)", dotc: "var(--slate-400)" },
    blue:    { bg: "var(--ink-100)", fg: "var(--ink-700)", dotc: "var(--ink-500)" },
    gold:    { bg: "var(--brass-100)", fg: "var(--brass-800)", dotc: "var(--brass-600)" },
    success: { bg: "var(--success-100)", fg: "var(--success-600)", dotc: "var(--success-600)" },
    danger:  { bg: "var(--danger-100)", fg: "var(--danger-600)", dotc: "var(--danger-600)" },
    warning: { bg: "var(--warning-100)", fg: "var(--warning-600)", dotc: "var(--warning-600)" },
  }[tone];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px",
      background: tones.bg, color: tones.fg,
      fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 600,
      letterSpacing: "0.02em",
      borderRadius: "var(--radius-pill)",
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: tones.dotc, flexShrink: 0 }} />}
      {children}
    </span>
  );
}
