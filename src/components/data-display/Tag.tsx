import React from "react";

interface TagProps {
  children?: React.ReactNode;
  onRemove?: () => void;
  tone?: "blue" | "gold" | "neutral";
  style?: React.CSSProperties;
}

export function Tag({ children, onRemove, tone = "blue", style = {} }: TagProps) {
  const tones = {
    blue:    { bg: "var(--ink-100)", fg: "var(--ink-700)", border: "var(--ink-200)" },
    gold:    { bg: "var(--brass-100)", fg: "var(--brass-800)", border: "var(--brass-200)" },
    neutral: { bg: "var(--paper-100)", fg: "var(--slate-700)", border: "var(--line-300)" },
  }[tone];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px 5px 12px",
      background: tones.bg, color: tones.fg,
      border: `1px solid ${tones.border}`,
      fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 500,
      borderRadius: "var(--radius-sm)",
      ...style,
    }}>
      {children}
      {onRemove && (
        <button onClick={onRemove} aria-label="Remove" style={{
          border: "none", background: "transparent", cursor: "pointer",
          color: tones.fg, opacity: 0.6, fontSize: 14, lineHeight: 1, padding: 0,
          display: "inline-flex",
        }}>×</button>
      )}
    </span>
  );
}
