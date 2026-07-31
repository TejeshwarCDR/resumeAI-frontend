import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Toast({ msg, type = "success" }: { msg: string; type?: "success" | "error" | "info" }) {
  const isError = type === "error";
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: isError ? "var(--danger-600, #dc2626)" : "var(--ink-900)",
        color: "var(--paper-50)",
        fontFamily: "var(--font-body)",
        fontSize: 13.5,
        fontWeight: 500,
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 380,
      }}
    >
      {isError ? <AlertCircle size={15} strokeWidth={2} /> : <CheckCircle2 size={15} strokeWidth={2} />}
      {msg}
    </div>
  );
}
