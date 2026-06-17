import React from "react";

interface CardProps {
  variant?: "default" | "raised" | "seal";
  interactive?: boolean;
  padding?: string | number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({
  variant = "default",
  interactive = false,
  padding = "var(--space-5)",
  children,
  style = {},
  onClick,
  ...rest
}: CardProps) {
  const [hover, setHover] = React.useState(false);

  const base = {
    default: { background: "var(--paper-50)", border: "1.5px solid var(--line-300)", shadow: "var(--shadow-xs)" },
    raised:  { background: "var(--surface-raised)", border: "1px solid var(--line-200)", shadow: "var(--shadow-md)" },
    seal:    { background: "var(--surface-raised)", border: "1px solid var(--brass-200)", shadow: "var(--shadow-sm)" },
  }[variant];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: "relative",
        background: base.background,
        border: base.border,
        borderRadius: "var(--radius-lg)",
        boxShadow: interactive && hover ? "var(--shadow-lg)" : base.shadow,
        padding,
        transform: interactive && hover ? "translateY(-2px)" : "none",
        transition: "box-shadow var(--dur-normal) var(--ease-standard), transform var(--dur-normal) var(--ease-standard)",
        cursor: interactive ? "pointer" : "default",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {variant === "seal" && (
        <span style={{ position: "absolute", insetInline: 0, top: 0, height: 4, background: "linear-gradient(90deg, var(--brass-400), var(--brass-600))" }} />
      )}
      {children}
    </div>
  );
}
