import React from "react";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  ring?: boolean;
  style?: React.CSSProperties;
}

export function Avatar({ name = "", src, size = 44, ring = false, style = {} }: AvatarProps) {
  const initials = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      background: src ? "transparent" : "var(--ink-700)",
      color: "var(--paper-50)",
      fontFamily: "var(--font-body)", fontWeight: 600, fontSize: size * 0.38,
      overflow: "hidden", flexShrink: 0,
      boxShadow: ring ? "0 0 0 2px var(--paper-50), 0 0 0 4px var(--brass-500)" : "none",
      ...style,
    }}>
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </span>
  );
}
