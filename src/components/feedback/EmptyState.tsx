import React from "react";

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "var(--space-8) var(--space-6)", gap: "var(--space-4)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", fontWeight: 600, color: "var(--text-secondary)" }}>{title}</div>
      {body && <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-body-sm)", color: "var(--text-muted)", maxWidth: 360 }}>{body}</div>}
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
}
