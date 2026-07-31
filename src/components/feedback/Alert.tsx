import React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertTone = "info" | "success" | "warning" | "danger";

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

const TONES: Record<AlertTone, { bg: string; border: string; fg: string; icon: React.ReactNode }> = {
  info: {
    bg: "var(--ink-50, #eff6ff)",
    border: "var(--ink-200, #bfdbfe)",
    fg: "var(--ink-700)",
    icon: <Info size={16} strokeWidth={1.9} />,
  },
  success: {
    bg: "var(--success-100)",
    border: "var(--success-200, #bbf7d0)",
    fg: "var(--success-700, #15803d)",
    icon: <CheckCircle2 size={16} strokeWidth={1.9} />,
  },
  warning: {
    bg: "var(--warning-100)",
    border: "var(--warning-200, #fde68a)",
    fg: "var(--warning-700, #a16207)",
    icon: <TriangleAlert size={16} strokeWidth={1.9} />,
  },
  danger: {
    bg: "var(--danger-100)",
    border: "var(--danger-200, #fecaca)",
    fg: "var(--danger-700, #b91c1c)",
    icon: <AlertCircle size={16} strokeWidth={1.9} />,
  },
};

export function Alert({ tone = "info", title, children, action, style = {} }: AlertProps) {
  const cfg = TONES[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.fg,
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span style={{ display: "inline-flex", flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: 2 }}>{title}</div>}
        <div>{children}</div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
