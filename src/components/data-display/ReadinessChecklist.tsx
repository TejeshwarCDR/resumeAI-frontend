import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface ReadinessItem {
  label: string;
  complete: boolean;
  action?: React.ReactNode;
}

export function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <div style={{ display: "grid", gap: 9 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            borderRadius: "var(--radius-sm)",
            background: item.complete ? "var(--success-100)" : "var(--paper-200)",
            color: item.complete ? "var(--success-700, #15803d)" : "var(--slate-700)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        >
          {item.complete ? (
            <CheckCircle2 size={15} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={15} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.action}
        </div>
      ))}
    </div>
  );
}
