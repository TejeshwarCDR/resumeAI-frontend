import React from "react";

interface ProgressMeterProps {
  value?: number;
  label?: string;
  showValue?: boolean;
  height?: number;
  tone?: "gold" | "blue";
  style?: React.CSSProperties;
}

export function ProgressMeter({ value = 0, label, showValue = true, height = 10, tone = "gold", style = {} }: ProgressMeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = tone === "blue"
    ? "linear-gradient(90deg, var(--ink-500), var(--ink-700))"
    : "linear-gradient(90deg, var(--brass-400), var(--brass-600))";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {label && <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-700)" }}>{label}</span>}
          {showValue && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--brass-800)" }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height, background: "var(--paper-300)", borderRadius: "var(--radius-pill)", overflow: "hidden", boxShadow: "var(--shadow-inset)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: "var(--radius-pill)", transition: "width var(--dur-slow) var(--ease-emphasized)" }} />
      </div>
    </div>
  );
}
