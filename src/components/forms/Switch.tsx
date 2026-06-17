import React from "react";

interface SwitchProps {
  checked?: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  style?: React.CSSProperties;
}

let _swCounter = 0;

export function Switch({ checked = false, onChange, disabled = false, label, id, style = {} }: SwitchProps) {
  const autoId = React.useRef(`sw${++_swCounter}`).current;
  const fieldId = id || autoId;

  return (
    <label htmlFor={fieldId} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, ...style }}>
      <button
        id={fieldId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 44,
          height: 26,
          borderRadius: "var(--radius-pill)",
          border: "1.5px solid",
          borderColor: checked ? "var(--brass-600)" : "var(--line-300)",
          background: checked ? "var(--brass-500)" : "var(--paper-200)",
          padding: 0,
          position: "relative",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background var(--dur-normal) var(--ease-standard), border-color var(--dur-normal) var(--ease-standard)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--white)",
            boxShadow: "var(--shadow-sm)",
            transition: "left var(--dur-normal) var(--ease-emphasized)",
          }}
        />
      </button>
      {label && <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
