import React from "react";

type StepItem = string | { label: string };

interface StepperProps {
  steps?: StepItem[];
  current?: number;
  style?: React.CSSProperties;
}

export function Stepper({ steps = [], current = 0, style = {} }: StepperProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", ...style }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const label = typeof s === "string" ? s : s.label;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "0 0 auto", width: 96 }}>
              <span style={{
                width: 30, height: 30, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                background: done ? "var(--brass-500)" : active ? "var(--paper-50)" : "var(--paper-200)",
                color: done ? "var(--ink-900)" : active ? "var(--brass-800)" : "var(--slate-400)",
                border: `2px solid ${done || active ? "var(--brass-500)" : "var(--line-300)"}`,
                boxShadow: active ? "0 0 0 4px var(--focus-ring)" : "none",
                transition: "all var(--dur-normal) var(--ease-standard)",
              }}>
                {done ? "✓" : i + 1}
              </span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--ink-900)" : "var(--slate-500)",
                textAlign: "center", lineHeight: 1.2,
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 2, marginTop: 15, background: done ? "var(--brass-500)" : "var(--line-300)", transition: "background var(--dur-normal) var(--ease-standard)" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
