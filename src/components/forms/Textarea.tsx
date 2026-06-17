import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: React.CSSProperties;
}

let _taCounter = 0;

export function Textarea({ label, hint, error, rows = 5, id, style = {}, containerStyle = {}, ...rest }: TextareaProps) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useRef(`ta${++_taCounter}`).current;
  const fieldId = id || autoId;
  const borderColor = error ? "var(--danger-600)" : focus ? "var(--ink-500)" : "var(--line-300)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label && (
        <label htmlFor={fieldId} style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--slate-700)" }}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          resize: "vertical",
          padding: "12px 14px",
          background: "var(--paper-50)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focus ? "0 0 0 3px var(--focus-ring)" : "var(--shadow-inset)",
          fontFamily: "var(--font-body)",
          fontSize: "0.9375rem",
          lineHeight: 1.55,
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)",
          ...style,
        }}
        {...rest}
      />
      {(hint || error) && (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: error ? "var(--danger-600)" : "var(--slate-500)" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
