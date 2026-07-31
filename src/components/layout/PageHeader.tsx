import React from "react";

interface PageHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ overline, title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="sig-page-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 30 }}>
      <div style={{ minWidth: 0 }}>
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
        {subtitle && (
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            color: "var(--slate-600)",
            lineHeight: 1.55,
            margin: "8px 0 0",
            maxWidth: 720,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="sig-page-header-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>{children}</div>}
    </div>
  );
}
