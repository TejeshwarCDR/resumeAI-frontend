import React from "react";

export type ResumeTemplateId =
  | "primary"
  | "classic-professional"
  | "technical-modern"
  | "executive-minimal";

export interface ResumeTemplateOption {
  id: ResumeTemplateId;
  name: string;
  description: string;
  category: "standard" | "classic" | "technical" | "minimal";
  atsFriendly: true;
  supportsPhoto: false;
}

export const resumeTemplates: ResumeTemplateOption[] = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional single-column ATS-safe layout for broad professional use.",
    category: "classic",
    atsFriendly: true,
    supportsPhoto: false,
  },
  {
    id: "technical-modern",
    name: "Technical Modern",
    description: "Modern engineering-focused layout with strong skills and project hierarchy.",
    category: "technical",
    atsFriendly: true,
    supportsPhoto: false,
  },
  {
    id: "executive-minimal",
    name: "Executive Minimal",
    description: "Elegant impact-first layout for polished professional applications.",
    category: "minimal",
    atsFriendly: true,
    supportsPhoto: false,
  },
  {
    id: "primary",
    name: "Primary",
    description: "Default Signuture academic-style resume template.",
    category: "standard",
    atsFriendly: true,
    supportsPhoto: false,
  },
];

const legacyTemplateLabels: Record<string, string> = {
  academic: "Primary",
  modern: "Primary",
  minimal: "Primary",
};

export function normalizeResumeTemplateId(value?: string | null): ResumeTemplateId {
  return resumeTemplates.some((template) => template.id === value)
    ? (value as ResumeTemplateId)
    : "primary";
}

export function getResumeTemplate(value?: string | null): ResumeTemplateOption {
  return (
    resumeTemplates.find((template) => template.id === normalizeResumeTemplateId(value)) ??
    resumeTemplates[resumeTemplates.length - 1]
  );
}

export function getResumeTemplateLabel(value?: string | null): string {
  if (value && legacyTemplateLabels[value]) return legacyTemplateLabels[value];
  return getResumeTemplate(value).name;
}

const line = (width: string, height = 3): React.CSSProperties => ({
  width,
  height,
  borderRadius: 999,
  background: "currentColor",
  opacity: 0.55,
});

export function ResumeTemplateThumbnail({ templateId }: { templateId: string }) {
  const id = normalizeResumeTemplateId(templateId);
  const accent =
    id === "technical-modern"
      ? "#23395b"
      : id === "executive-minimal"
        ? "#4a4a4a"
        : id === "classic-professional"
          ? "#222"
          : "#003399";
  const serif = id === "classic-professional" || id === "primary";

  return (
    <div
      aria-hidden="true"
      style={{
        height: 92,
        borderRadius: 6,
        background: "#fff",
        border: "1px solid var(--line-200)",
        padding: id === "executive-minimal" ? 13 : 11,
        color: accent,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
        fontFamily: serif ? "Georgia, serif" : "var(--font-body)",
        display: "flex",
        flexDirection: "column",
        gap: id === "executive-minimal" ? 7 : 5,
      }}
    >
      <div
        style={{
          ...line(id === "technical-modern" ? "42%" : id === "executive-minimal" ? "34%" : "52%", 5),
          alignSelf: id === "classic-professional" || id === "primary" ? "center" : "flex-start",
          opacity: 0.85,
        }}
      />
      <div
        style={{
          display: "flex",
          gap: 4,
          justifyContent: id === "classic-professional" || id === "primary" ? "center" : "flex-start",
        }}
      >
        <span style={line("18%", 2)} />
        <span style={line("22%", 2)} />
        <span style={line("16%", 2)} />
      </div>
      {id === "technical-modern" && <div style={{ height: 2, background: accent, opacity: 0.85, margin: "1px 0 3px" }} />}
      {id === "executive-minimal" && <div style={{ height: 1, background: "#d8d8d8", margin: "0 0 2px" }} />}
      <div style={{ height: 1, background: id === "technical-modern" ? "#c9d1df" : "#333", opacity: id === "executive-minimal" ? 0.15 : 0.65 }} />
      <span style={line("100%", 2)} />
      <span style={line("82%", 2)} />
      <div style={{ height: 1, background: id === "executive-minimal" ? "#e4e4e4" : "#333", opacity: 0.3, marginTop: 2 }} />
      <span style={line("72%", 3)} />
      <span style={line("96%", 2)} />
      <span style={line("88%", 2)} />
    </div>
  );
}
