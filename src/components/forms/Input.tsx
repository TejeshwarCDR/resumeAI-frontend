import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

let _inputCounter = 0;

export function Input({
  label,
  hint,
  error,
  leading = null,
  trailing = null,
  id,
  style = {},
  containerStyle = {},
  ...rest
}: InputProps) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useRef(`input${++_inputCounter}`).current;
  const fieldId = id || autoId;
  const borderColor = error ? "var(--danger-600)" : focus ? "var(--ink-500)" : "var(--line-300)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-700)" }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 46,
          padding: "0 14px",
          background: "var(--paper-50)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "var(--shadow-inset)",
          transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
        }}
      >
        {leading && <span style={{ display: "inline-flex", color: "var(--slate-500)" }}>{leading}</span>}
        <input
          id={fieldId}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            color: "var(--text-primary)",
            minWidth: 0,
            ...style,
          }}
          {...rest}
        />
        {trailing && <span style={{ display: "inline-flex", color: "var(--slate-500)" }}>{trailing}</span>}
      </div>
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: error ? "var(--danger-600)" : "var(--slate-500)" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
