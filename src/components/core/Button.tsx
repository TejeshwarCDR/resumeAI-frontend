import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = "button",
  children,
  style = {},
  ...rest
}: ButtonProps) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);

  const sizes = {
    sm: { padding: "0 14px", height: 34, fontSize: "0.8125rem", gap: 6, radius: "var(--radius-sm)" },
    md: { padding: "0 20px", height: 44, fontSize: "0.9375rem", gap: 8, radius: "var(--radius-md)" },
    lg: { padding: "0 28px", height: 54, fontSize: "1.0625rem", gap: 10, radius: "var(--radius-md)" },
  }[size];

  const palettes = {
    primary:   { bg: "var(--ink-600)", bgHover: "var(--ink-700)", bgPress: "var(--ink-800)", fg: "var(--paper-50)", border: "transparent", shadow: "var(--shadow-sm)" },
    gold:      { bg: "var(--brass-500)", bgHover: "var(--brass-600)", bgPress: "var(--brass-700)", fg: "var(--ink-900)", border: "transparent", shadow: "var(--shadow-gold)" },
    secondary: { bg: "transparent", bgHover: "var(--paper-200)", bgPress: "var(--paper-300)", fg: "var(--ink-800)", border: "var(--ink-300)", shadow: "none" },
    ghost:     { bg: "transparent", bgHover: "var(--paper-200)", bgPress: "var(--paper-300)", fg: "var(--ink-700)", border: "transparent", shadow: "none" },
    danger:    { bg: "var(--danger-600)", bgHover: "var(--danger-700)", bgPress: "var(--danger-800)", fg: "var(--paper-50)", border: "transparent", shadow: "var(--shadow-sm)" },
  }[variant];

  const bg = disabled ? "var(--paper-300)" : press ? palettes.bgPress : hover ? palettes.bgHover : palettes.bg;

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.gap,
        height: sizes.height,
        padding: sizes.padding,
        fontFamily: "var(--font-body)",
        fontWeight: 600,
        fontSize: sizes.fontSize,
        letterSpacing: "0.01em",
        color: disabled ? "var(--slate-400)" : palettes.fg,
        background: bg,
        border: `1.5px solid ${disabled ? "transparent" : palettes.border}`,
        borderRadius: sizes.radius,
        boxShadow: disabled || variant === "ghost" || variant === "secondary" ? "none" : palettes.shadow,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: press && !disabled ? "translateY(1px)" : "none",
        transition: "background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {iconLeft && <span style={{ display: "inline-flex" }}>{iconLeft}</span>}
      {children}
      {iconRight && <span style={{ display: "inline-flex" }}>{iconRight}</span>}
    </button>
  );
}
