import React from "react";

type SelectOption = string | { value: string; label: string };

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options?: SelectOption[];
  containerStyle?: React.CSSProperties;
}

let _selCounter = 0;

export function Select({ label, hint, options = [], id, style = {}, containerStyle = {}, ...rest }: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useRef(`sel${++_selCounter}`).current;
  const fieldId = id || autoId;
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-700)" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <select
          id={fieldId}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            height: 46,
            padding: "0 38px 0 14px",
            appearance: "none",
            background: "var(--paper-50)",
            border: `1.5px solid ${focus ? "var(--ink-500)" : "var(--line-300)"}`,
            borderRadius: "var(--radius-md)",
            boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "var(--shadow-inset)",
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            color: "var(--text-primary)",
            cursor: "pointer",
            outline: "none",
            transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
            ...style,
          }}
          {...rest}
        >
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--slate-500)", fontSize: 12 }}>▾</span>
      </div>
      {hint && <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--slate-500)" }}>{hint}</span>}
    </div>
  );
}
