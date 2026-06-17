import React from "react";

interface PageHeaderProps {
  overline?: string;
  title: string;
  children?: React.ReactNode;
}

export function PageHeader({ overline, title, children }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
      <div>
        {overline && (
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--brass-700)",
          }}>
            {overline}
          </div>
        )}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 42,
          color: "var(--ink-900)",
          margin: "6px 0 0",
          letterSpacing: "-0.01em",
        }}>
          {title}
        </h1>
      </div>
      {children && <div style={{ display: "flex", gap: 10 }}>{children}</div>}
    </div>
  );
}
