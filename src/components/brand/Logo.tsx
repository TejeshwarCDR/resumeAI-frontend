import React from "react";

interface LogoProps {
  variant?: "wordmark" | "stacked" | "lockup";
  size?: number;
  color?: string;
  accent?: string;
  tagline?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Logo({
  variant = "wordmark",
  size = 56,
  color = "var(--ink-900)",
  accent = "var(--brass-600)",
  tagline = "Crafted around who you are. Signed for who you'll become.",
  className = "",
  style = {},
}: LogoProps) {
  const name = (
    <span
      style={{
        fontFamily: "var(--font-script)",
        fontSize: size,
        lineHeight: 0.9,
        color,
        display: "inline-block",
        paddingRight: size * 0.06,
      }}
    >
      Signuture
    </span>
  );

  if (variant === "stacked") {
    return (
      <span className={className} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: size * 0.06, ...style }}>
        {name}
        <span style={{ fontFamily: "var(--font-body)", fontSize: Math.max(9, size * 0.16), fontWeight: 500, letterSpacing: "0.04em", color: "var(--slate-500)", fontStyle: "italic" }}>
          {tagline}
        </span>
      </span>
    );
  }

  if (variant === "lockup") {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.22, ...style }}>
        <span style={{ width: size * 0.5, height: 1.5, background: accent }} />
        {name}
        <span style={{ width: size * 0.5, height: 1.5, background: accent }} />
      </span>
    );
  }

  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "baseline", ...style }}>
      {name}
    </span>
  );
}
