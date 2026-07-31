import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  Stamp,
  Check,
  AlertTriangle,
  Lightbulb,
  Sparkle,
  Download,
  Link,
  X,
  Phone,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Mail,
  Pencil,
  Save,
  Plus,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Tabs } from "@/components/navigation/Tabs";
import { Button } from "@/components/core/Button";
import { Badge } from "@/components/data-display/Badge";
import { Tag } from "@/components/data-display/Tag";
import { PageContainer } from "@/components/layout/PageContainer";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Seal } from "@/components/brand/Seal";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { User } from "@/store/auth";
import { getResumeTemplateLabel, normalizeResumeTemplateId } from "@/lib/resumeTemplates";

// ─── Data types ───────────────────────────────────────────────────────────────

const SKILL_CATEGORY_ORDER = [
  "Programming Languages",
  "Frontend",
  "Backend",
  "Databases",
  "Cloud & DevOps",
  "Data & AI",
  "Testing & Quality",
  "Tools",
  "Other",
];

const SKILL_CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: "Programming Languages", keywords: ["typescript", "javascript", "python", "java", "go", "golang", "ruby", "php", "rust", "swift", "kotlin"] },
  { category: "Frontend", keywords: ["react", "next js", "vue", "angular", "html", "css", "tailwind", "redux", "vite"] },
  { category: "Backend", keywords: ["node js", "fastify", "express", "rest api", "graphql", "microservices", "api", "serverless"] },
  { category: "Databases", keywords: ["postgresql", "postgres", "mysql", "mongodb", "redis", "sql", "database", "supabase", "prisma"] },
  { category: "Cloud & DevOps", keywords: ["aws", "gcp", "azure", "docker", "kubernetes", "k8s", "ci cd", "github actions", "terraform", "s3"] },
  { category: "Data & AI", keywords: ["machine learning", "artificial intelligence", "ai", "ml", "llm", "rag", "pandas", "numpy", "scikit learn", "tensorflow", "pytorch"] },
  { category: "Testing & Quality", keywords: ["testing", "vitest", "jest", "playwright", "cypress", "debugging", "performance tuning"] },
  { category: "Tools", keywords: ["git", "github", "jira", "figma", "postman", "linux", "bash"] },
];

function normalizeSkillPhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function categoryForSkill(skill: string): string {
  const normalized = normalizeSkillPhrase(skill);
  return SKILL_CATEGORY_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized === keyword || ` ${normalized} `.includes(` ${keyword} `)),
  )?.category ?? "Other";
}

function orderSkillCategories(skills: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(skills).sort(([left], [right]) => {
      const leftIndex = SKILL_CATEGORY_ORDER.indexOf(left);
      const rightIndex = SKILL_CATEGORY_ORDER.indexOf(right);
      return (
        (leftIndex === -1 ? SKILL_CATEGORY_ORDER.length : leftIndex) -
          (rightIndex === -1 ? SKILL_CATEGORY_ORDER.length : rightIndex) ||
        left.localeCompare(right)
      );
    }),
  );
}

function collectSkillNames(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  const names: string[] = [];
  if (Array.isArray(raw)) {
    names.push(
      ...raw.map((s: unknown) => {
        if (typeof s === "string") return s.trim();
        if (s && typeof s === "object") {
          const o = s as Record<string, unknown>;
          return String(o.name ?? o.skill_name ?? o.title ?? "").trim();
        }
        return "";
      }).filter(Boolean),
    );
  } else if (typeof raw === "object") {
    for (const values of Object.values(raw as Record<string, unknown>)) {
      names.push(
        ...(Array.isArray(values)
          ? values.map((item) => String(item).trim()).filter(Boolean)
          : String(values ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)),
      );
    }
  }
  return Array.from(new Set(names));
}

function normalizeSkills(raw: unknown): Record<string, string[]> | undefined {
  const names = collectSkillNames(raw);
  if (!names?.length) return undefined;
  const categorized: Record<string, string[]> = {};
  for (const name of names) {
    const category = categoryForSkill(name);
    categorized[category] = [...(categorized[category] ?? []), name];
  }
  return orderSkillCategories(categorized);
}

interface GeneratedContent {
  summary?: string;
  experience?: Array<{
    company?: string;
    role?: string;
    period?: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    tech_stack?: string[];
    bullets?: string[];
    url?: string;
    link?: string;
    project_url?: string;
    repository_url?: string;
    live_url?: string;
  }>;
  researchPapers?: Array<{
    title?: string;
    authors?: string[];
    venue?: string;
    year?: string;
    date?: string;
    doi?: string;
    arxivUrl?: string;
    publicationUrl?: string;
    githubUrl?: string;
    description?: string;
    keywords?: string[];
    status?: string;
  }>;
  skills?: Record<string, string[]>;
  education?: Array<{
    institution?: string;
    degree?: string;
    period?: string;
    gpa?: string;
  }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
}

interface ResumeVersion {
  id: string;
  version_label: string;
  status: "draft" | "submitted" | "archived";
  job_title?: string;
  company_name?: string;
  template_id: string;
  page_length: string;
  ats_score: number;
  ats_feedback?: {
    score?: number;
    foundKeywords?: string[];
    missingKeywords?: string[];
    suggestions?: string[];
  };
  generated_content?: GeneratedContent;
  pdf_signed_url?: string;
}

interface AtsResult {
  resumeVersionId: string;
  versionLabel: string | null;
  atsScore: number | null;
  atsFeedback: {
    score?: number;
    foundKeywords?: string[];
    missingKeywords?: string[];
    suggestions?: string[];
  } | null;
  jobTitle: string | null;
  companyName: string | null;
}

interface CoverLetterData {
  id: string;
  content: string;
}

// ─── Style settings ────────────────────────────────────────────────────────────

interface StyleSettings {
  fontFamily: string;
  bodySize: number; // pt
  headingSize: number; // pt
  lineHeight: number;
  margins: number; // px
}

const ACADEMIC_SERIF_FONT = `"CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif`;
const ACADEMIC_LINK_BLUE = "#003399";
const A4_W = 794;
const A4_H = 1123;
const PAGE_GAP = 32;
const PT_TO_PX = 96 / 72;

const FONT_OPTIONS = [
  { value: ACADEMIC_SERIF_FONT, label: "Academic Serif" },
  { value: '"Georgia", "Times New Roman", serif', label: "Georgia Classic" },
  { value: '"Helvetica Neue", Arial, sans-serif', label: "Helvetica Modern" },
  { value: '"Garamond", "EB Garamond", serif', label: "Garamond Elegant" },
];

const DEFAULT_STYLE: StyleSettings = {
  fontFamily: ACADEMIC_SERIF_FONT,
  bodySize: 12,
  headingSize: 17.5,
  lineHeight: 1.2,
  margins: 40,
};

function getTemplateStyleSettings(templateId?: string | null): StyleSettings {
  const id = normalizeResumeTemplateId(templateId);
  if (id === "classic-professional") {
    return {
      fontFamily: '"Georgia", "Times New Roman", serif',
      bodySize: 10,
      headingSize: 11,
      lineHeight: 1.36,
      margins: 60,
    };
  }
  if (id === "technical-modern") {
    return {
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      bodySize: 10,
      headingSize: 11,
      lineHeight: 1.38,
      margins: 56,
    };
  }
  if (id === "executive-minimal") {
    return {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
      bodySize: 10,
      headingSize: 10.5,
      lineHeight: 1.45,
      margins: 64,
    };
  }
  return DEFAULT_STYLE;
}

// ─── Utility functions ─────────────────────────────────────────────────────────

function ensureUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function extractGithubUsername(url: string): string {
  const m = url.match(/github\.com\/([^/?#\s]+)/i);
  if (m) return m[1];
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function extractLinkedinUsername(url: string): string {
  const m = url.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
  if (m) return m[1];
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function getProjectHref(
  project: NonNullable<GeneratedContent["projects"]>[number],
) {
  return (
    project.project_url ||
    project.live_url ||
    project.repository_url ||
    project.url ||
    project.link
  );
}

function getResearchPaperHref(
  paper: NonNullable<GeneratedContent["researchPapers"]>[number],
) {
  if (paper.publicationUrl) return paper.publicationUrl;
  if (paper.arxivUrl) return paper.arxivUrl;
  if (paper.doi) {
    return /^https?:\/\//i.test(paper.doi)
      ? paper.doi
      : `https://doi.org/${paper.doi.replace(/^doi:\s*/iu, "")}`;
  }
  return paper.githubUrl;
}

function cleanPreviewText(value: unknown): string {
  return String(value ?? "")
    .replace(/#+/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparableText(value: unknown): string {
  return cleanPreviewText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupePreviewBullets(
  bullets: string[] | undefined,
  ...existingText: unknown[]
): string[] | undefined {
  const references = existingText
    .map(normalizeComparableText)
    .filter((text) => text.length >= 40);
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const bullet of bullets ?? []) {
    const cleaned = cleanPreviewText(bullet);
    const comparable = normalizeComparableText(cleaned);
    if (!cleaned || !comparable || seen.has(comparable)) continue;

    const duplicatesExisting = references.some(
      (reference) =>
        comparable === reference ||
        comparable.includes(reference) ||
        reference.includes(comparable),
    );
    if (duplicatesExisting) continue;

    seen.add(comparable);
    deduped.push(cleaned);
  }

  return deduped.length ? deduped : undefined;
}

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

function formatDateForPreview(value: unknown): string {
  const text = cleanPreviewText(value);
  if (!text) return "";
  if (/^\d{4}$/u.test(text)) return text;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}|GMT|UTC|T\d{2}:/iu.test(text)) {
    return monthFormatter.format(parsed);
  }

  return text;
}

function normalizePeriodForPreview(period?: string): string | undefined {
  const text = cleanPreviewText(period);
  if (!text) return undefined;
  const parts = text.split(/\s+[–-]\s+/u).filter(Boolean);
  if (parts.length >= 2) {
    const start = formatDateForPreview(parts[0]);
    const end = /^present$/iu.test(parts.slice(1).join(" - "))
      ? "Present"
      : formatDateForPreview(parts.slice(1).join(" - "));
    return [start, end].filter(Boolean).join(" - ");
  }
  return formatDateForPreview(text);
}

function isInvalidSummary(summary?: string): boolean {
  const text = cleanPreviewText(summary);
  return !text || /^#|job description|^company$/iu.test(text);
}

function buildPreviewSummary(
  content: GeneratedContent | undefined,
  resume: ResumeVersion,
): string {
  const skillNames = Object.values(normalizeSkills(content?.skills) ?? {})
    .flat()
    .slice(0, 5);
  const evidence = [
    ...(content?.experience ?? []).map((item) => item.role || item.company),
    ...(content?.projects ?? []).map((item) => item.name),
  ]
    .filter(Boolean)
    .slice(0, 2);
  const role = resume.job_title || "target role";
  const company = resume.company_name ? ` at ${resume.company_name}` : "";
  const skills = skillNames.length
    ? ` with strength in ${skillNames.join(", ")}`
    : "";
  const proof = evidence.length ? `, backed by ${evidence.join(" and ")}` : "";
  return `Candidate aligned to the ${role}${company}${skills}${proof}. Brings relevant portfolio evidence, practical execution, and role-focused communication to deliver measurable impact.`;
}

function normalizeContentForPreview(
  content: GeneratedContent | undefined,
  resume: ResumeVersion,
): GeneratedContent | undefined {
  if (!content) return undefined;

  const summary = cleanPreviewText(content.summary);

  return {
    ...content,
    summary: isInvalidSummary(summary)
      ? buildPreviewSummary(content, resume)
      : summary,
    experience: content.experience?.map((item) => ({
      ...item,
      role: cleanPreviewText(item.role),
      company: cleanPreviewText(item.company),
      period: normalizePeriodForPreview(item.period),
      bullets: dedupePreviewBullets(item.bullets),
    })),
    projects: content.projects?.map((item) => {
      const description = cleanPreviewText(item.description);
      return {
        ...item,
        name: cleanPreviewText(item.name),
        description,
        tech_stack: item.tech_stack?.map(cleanPreviewText).filter(Boolean),
        bullets: dedupePreviewBullets(item.bullets, description),
      };
    }),
    researchPapers: content.researchPapers?.map((item) => ({
      ...item,
      title: cleanPreviewText(item.title),
      authors: item.authors?.map(cleanPreviewText).filter(Boolean),
      venue: cleanPreviewText(item.venue),
      year: cleanPreviewText(item.year),
      date: cleanPreviewText(item.date),
      doi: cleanPreviewText(item.doi),
      arxivUrl: cleanPreviewText(item.arxivUrl),
      publicationUrl: cleanPreviewText(item.publicationUrl),
      githubUrl: cleanPreviewText(item.githubUrl),
      description: cleanPreviewText(item.description),
      keywords: item.keywords?.map(cleanPreviewText).filter(Boolean),
      status: cleanPreviewText(item.status),
    })),
    skills: normalizeSkills(content.skills) ?? undefined,
    education: content.education?.map((item) => ({
      ...item,
      institution: cleanPreviewText(item.institution),
      degree: cleanPreviewText(item.degree),
      period: normalizePeriodForPreview(item.period),
      gpa: cleanPreviewText(item.gpa),
    })),
    certifications: content.certifications?.map((item) => ({
      ...item,
      name: cleanPreviewText(item.name),
      issuer: cleanPreviewText(item.issuer),
      date: cleanPreviewText(item.date),
    })),
  };
}

// ─── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ value }: { value: number }) {
  const r = 42,
    c = 2 * Math.PI * r,
    off = c * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--paper-300)"
          strokeWidth="9"
        />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="var(--brass-500)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 55 55)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 34,
            fontWeight: 600,
            color: "var(--ink-900)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--slate-400)",
          }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

// ─── Resume section wrapper ────────────────────────────────────────────────────

function ResumePSection({
  title,
  children,
  onAddItem,
  headingSize,
  fontFamily,
  lineHeight,
}: {
  title: string;
  children: React.ReactNode;
  onAddItem?: () => void;
  headingSize: number;
  fontFamily: string;
  lineHeight: number;
}) {
  return (
    <section
      style={{
        marginBottom: Math.round(headingSize * PT_TO_PX * 1.3),
        breakInside: "auto",
        pageBreakInside: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #222",
          paddingBottom: 2,
          marginBottom: Math.round(headingSize * PT_TO_PX * 0.55),
          breakAfter: "avoid",
          pageBreakAfter: "avoid",
        }}
      >
        <h2
          style={{
            fontFamily,
            fontSize: Math.round(headingSize * PT_TO_PX),
            fontWeight: 500,
            letterSpacing: 0,
            textTransform: "uppercase",
            fontVariant: "small-caps",
            color: "#111",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          {title}
        </h2>
        {onAddItem && (
          <button
            onClick={onAddItem}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: ACADEMIC_LINK_BLUE,
              display: "inline-flex",
              alignItems: "center",
              padding: 0,
            }}
          >
            <Plus size={12} strokeWidth={2} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// ─── Contact row ───────────────────────────────────────────────────────────────

function ResumeContactRow({
  icon,
  value,
  href,
  bodySize,
  fontFamily,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
  bodySize: number;
  fontFamily: string;
}) {
  const fs = Math.round(bodySize * PT_TO_PX);
  const inner = (
    <>
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: ACADEMIC_LINK_BLUE,
        }}
      >
        {icon}
      </span>
      <span style={{ overflowWrap: "anywhere" }}>{value}</span>
    </>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily,
        fontSize: fs,
        lineHeight: 1.2,
        color: ACADEMIC_LINK_BLUE,
        textDecoration: "none",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {inner}
    </a>
  ) : (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily,
        fontSize: fs,
        lineHeight: 1.2,
        color: "#111",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {inner}
    </span>
  );
}

function ContactSeparator() {
  return (
    <span
      aria-hidden="true"
      style={{ color: "#222", fontSize: 15, lineHeight: 1 }}
    >
      |
    </span>
  );
}

// ─── Editable span ─────────────────────────────────────────────────────────────

function EditableSpan({
  value,
  onSave,
  editable,
  style,
  block,
}: {
  value: string;
  onSave?: (v: string) => void;
  editable: boolean;
  style?: React.CSSProperties;
  block?: boolean;
}) {
  return (
    <span
      contentEditable={editable || undefined}
      suppressContentEditableWarning
      onBlur={
        editable && onSave
          ? (e) => onSave(e.currentTarget.textContent ?? "")
          : undefined
      }
      style={{
        display: block ? "block" : undefined,
        outline: editable ? "none" : undefined,
        borderRadius: editable ? 2 : undefined,
        ...style,
      }}
    >
      {value}
    </span>
  );
}

// ─── Quick Style Editor ────────────────────────────────────────────────────────

function QuickStyleEditor({
  settings,
  onChange,
}: {
  settings: StyleSettings;
  onChange: (s: StyleSettings) => void;
}) {
  const set = <K extends keyof StyleSettings>(
    key: K,
    value: StyleSettings[K],
  ) => onChange({ ...settings, [key]: value });

  const labelRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    fontFamily: "var(--font-body)",
    fontSize: 11.5,
    fontWeight: 600,
    color: "var(--slate-600)",
  };
  const mono: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontWeight: 400,
    fontSize: 11,
    color: "var(--slate-400)",
  };
  const slider: React.CSSProperties = {
    width: "100%",
    accentColor: "var(--brass-500)",
    cursor: "pointer",
    margin: "2px 0",
  };
  const tickRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "var(--font-mono)",
    fontSize: 9.5,
    color: "var(--slate-400)",
    marginTop: 2,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Font family */}
      <div>
        <div style={labelRow}>
          <span>Font family</span>
        </div>
        <select
          value={settings.fontFamily}
          onChange={(e) => set("fontFamily", e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid var(--line-300)",
            fontFamily: "var(--font-body)",
            fontSize: 12.5,
            background: "var(--surface)",
            color: "var(--ink-900)",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {FONT_OPTIONS.map((o) => (
            <option key={o.label} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body size */}
      <div>
        <div style={labelRow}>
          <span>Body size</span>
          <span style={mono}>{settings.bodySize}pt</span>
        </div>
        <input
          type="range"
          min={10}
          max={14}
          step={0.5}
          value={settings.bodySize}
          onChange={(e) => set("bodySize", Number(e.target.value))}
          style={slider}
        />
        <div style={tickRow}>
          <span>10pt</span>
          <span>14pt</span>
        </div>
      </div>

      {/* Heading size */}
      <div>
        <div style={labelRow}>
          <span>Heading size</span>
          <span style={mono}>{settings.headingSize}pt</span>
        </div>
        <input
          type="range"
          min={14}
          max={22}
          step={0.5}
          value={settings.headingSize}
          onChange={(e) => set("headingSize", Number(e.target.value))}
          style={slider}
        />
        <div style={tickRow}>
          <span>14pt</span>
          <span>22pt</span>
        </div>
      </div>

      {/* Line spacing */}
      <div>
        <div style={labelRow}>
          <span>Line spacing</span>
          <span style={mono}>{settings.lineHeight.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={1.0}
          max={1.6}
          step={0.05}
          value={settings.lineHeight}
          onChange={(e) => set("lineHeight", Number(e.target.value))}
          style={slider}
        />
        <div style={tickRow}>
          <span>1.0×</span>
          <span>1.6×</span>
        </div>
      </div>

      {/* Margins */}
      <div>
        <div style={labelRow}>
          <span>Margins</span>
          <span style={mono}>
            {settings.margins <= 32
              ? "Tight"
              : settings.margins <= 48
                ? "Normal"
                : "Wide"}
          </span>
        </div>
        <input
          type="range"
          min={24}
          max={64}
          step={8}
          value={settings.margins}
          onChange={(e) => set("margins", Number(e.target.value))}
          style={slider}
        />
        <div style={tickRow}>
          <span>Tight</span>
          <span>Wide</span>
        </div>
      </div>

      <button
        onClick={() => onChange(DEFAULT_STYLE)}
        style={{
          border: "1px solid var(--line-300)",
          background: "transparent",
          borderRadius: 6,
          padding: "7px 0",
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "var(--slate-500)",
          cursor: "pointer",
        }}
      >
        Reset to defaults
      </button>
    </div>
  );
}

// ─── A4 resume preview ─────────────────────────────────────────────────────────

function A4ResumePreview({
  content,
  resume,
  user,
  onContentChange,
  editable,
  styleSettings = DEFAULT_STYLE,
  onPagesChange,
  paperRef,
  currentPage,
}: {
  content: GeneratedContent | undefined;
  resume: ResumeVersion;
  user: User | null;
  onContentChange?: (c: GeneratedContent) => void;
  editable: boolean;
  styleSettings?: StyleSettings;
  onPagesChange?: (n: number) => void;
  paperRef?: React.RefObject<HTMLDivElement>;
  currentPage: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [measuredPages, setMeasuredPages] = useState(1);

  // Expose the inner pageRef to parent via paperRef (we use a merged approach)
  const mergedPageRef =
    (paperRef as React.RefObject<HTMLDivElement | null>) || pageRef;

  const bodyPx = Math.round(styleSettings.bodySize * PT_TO_PX);
  const headPx = Math.round(styleSettings.headingSize * PT_TO_PX);
  const namePx = Math.round(styleSettings.headingSize * PT_TO_PX * 1.43);
  const previewTemplateId = normalizeResumeTemplateId(resume.template_id);
  const isTechnical = previewTemplateId === "technical-modern";
  const isExecutive = previewTemplateId === "executive-minimal";
  const isClassic = previewTemplateId === "classic-professional";
  const accentColor = isTechnical ? "#23395b" : isExecutive ? "#444" : ACADEMIC_LINK_BLUE;
  const summaryTitle = isTechnical ? "Technical Summary" : isExecutive ? "Professional Profile" : "Summary";
  const projectsTitle = isTechnical || isExecutive ? "Selected Projects" : "Projects";
  const skillsTitle = isTechnical ? "Core Skills" : isExecutive ? "Additional Skills" : "Skills";

  useEffect(() => {
    const update = () => {
      if (containerRef.current)
        setScale(containerRef.current.offsetWidth / A4_W);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      if (!flowRef.current) return;
      const pageSpan = A4_W + PAGE_GAP;
      const pages = Math.max(
        1,
        Math.ceil((flowRef.current.scrollWidth + PAGE_GAP) / pageSpan),
      );
      setMeasuredPages(pages);
      onPagesChange?.(pages);
    };
    const frame = window.requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    if (flowRef.current) ro.observe(flowRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [content, editable, styleSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  const numPages = measuredPages;
  const pageSpan = A4_W + PAGE_GAP;
  const stripWidth = A4_W * numPages + PAGE_GAP * Math.max(0, numPages - 1);
  const safeCurrentPage = Math.max(1, Math.min(numPages, currentPage));
  const pageOffset = (safeCurrentPage - 1) * pageSpan;
  const contentColumnWidth = A4_W - styleSettings.margins * 2;

  const updateField = (patch: Partial<GeneratedContent>) => {
    if (!content || !onContentChange) return;
    onContentChange({ ...content, ...patch });
  };

  const updateExp = (
    i: number,
    key: keyof NonNullable<GeneratedContent["experience"]>[number],
    val: string,
  ) => {
    updateField({
      experience: (content?.experience ?? []).map((e, idx) =>
        idx === i ? { ...e, [key]: val } : e,
      ),
    });
  };
  const updateExpBullet = (i: number, j: number, val: string) => {
    updateField({
      experience: (content?.experience ?? []).map((e, idx) =>
        idx !== i
          ? e
          : {
              ...e,
              bullets: (e.bullets ?? []).map((b, k) => (k === j ? val : b)),
            },
      ),
    });
  };
  const addExpBullet = (i: number) => {
    updateField({
      experience: (content?.experience ?? []).map((e, idx) =>
        idx !== i
          ? e
          : { ...e, bullets: [...(e.bullets ?? []), "New bullet point"] },
      ),
    });
  };
  const removeExpBullet = (i: number, j: number) => {
    updateField({
      experience: (content?.experience ?? []).map((e, idx) =>
        idx !== i
          ? e
          : { ...e, bullets: (e.bullets ?? []).filter((_, k) => k !== j) },
      ),
    });
  };
  const addExperience = () => {
    updateField({
      experience: [
        ...(content?.experience ?? []),
        {
          role: "New Role",
          company: "Company",
          period: "2024 – Present",
          bullets: ["Describe your key achievement here"],
        },
      ],
    });
  };
  const removeExperience = (i: number) => {
    updateField({
      experience: (content?.experience ?? []).filter((_, idx) => idx !== i),
    });
  };

  const updateProj = (
    i: number,
    key: keyof NonNullable<GeneratedContent["projects"]>[number],
    val: string,
  ) => {
    updateField({
      projects: (content?.projects ?? []).map((p, idx) =>
        idx === i ? { ...p, [key]: val } : p,
      ),
    });
  };
  const updateProjBullet = (i: number, j: number, val: string) => {
    updateField({
      projects: (content?.projects ?? []).map((p, idx) =>
        idx !== i
          ? p
          : {
              ...p,
              bullets: (p.bullets ?? []).map((b, k) => (k === j ? val : b)),
            },
      ),
    });
  };
  const removeProjBullet = (i: number, j: number) => {
    updateField({
      projects: (content?.projects ?? []).map((p, idx) =>
        idx !== i
          ? p
          : { ...p, bullets: (p.bullets ?? []).filter((_, k) => k !== j) },
      ),
    });
  };
  const updateProjTech = (i: number, valStr: string) => {
    const tech_stack = valStr
      .split("·")
      .map((s) => s.trim())
      .filter(Boolean);
    updateField({
      projects: (content?.projects ?? []).map((p, idx) =>
        idx === i ? { ...p, tech_stack } : p,
      ),
    });
  };
  const addProject = () => {
    updateField({
      projects: [
        ...(content?.projects ?? []),
        {
          name: "New Project",
          description: "Brief project description",
          tech_stack: ["TypeScript"],
          bullets: ["Key achievement or feature"],
        },
      ],
    });
  };
  const removeProject = (i: number) => {
    updateField({
      projects: (content?.projects ?? []).filter((_, idx) => idx !== i),
    });
  };

  const updateResearchPaper = (
    i: number,
    key: keyof NonNullable<GeneratedContent["researchPapers"]>[number],
    val: string,
  ) => {
    updateField({
      researchPapers: (content?.researchPapers ?? []).map((paper, idx) =>
        idx === i ? { ...paper, [key]: val } : paper,
      ),
    });
  };
  const updateResearchAuthors = (i: number, valStr: string) => {
    updateField({
      researchPapers: (content?.researchPapers ?? []).map((paper, idx) =>
        idx === i
          ? {
              ...paper,
              authors: valStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : paper,
      ),
    });
  };
  const updateResearchKeywords = (i: number, valStr: string) => {
    updateField({
      researchPapers: (content?.researchPapers ?? []).map((paper, idx) =>
        idx === i
          ? {
              ...paper,
              keywords: valStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : paper,
      ),
    });
  };
  const addResearchPaper = () => {
    updateField({
      researchPapers: [
        ...(content?.researchPapers ?? []),
        {
          title: "New Research Paper",
          authors: [],
          venue: "Publication venue",
          year: "2024",
          description: "Brief abstract or paper summary",
        },
      ],
    });
  };
  const removeResearchPaper = (i: number) => {
    updateField({
      researchPapers: (content?.researchPapers ?? []).filter(
        (_, idx) => idx !== i,
      ),
    });
  };

  const updateSkillCat = (oldCat: string, newCat: string) => {
    if (!content?.skills) return;
    const updated: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(content.skills))
      updated[k === oldCat ? newCat : k] = v;
    updateField({ skills: updated });
  };
  const updateSkillValues = (cat: string, valStr: string) => {
    updateField({
      skills: {
        ...(content?.skills ?? {}),
        [cat]: valStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    });
  };
  const addSkillCategory = () => {
    const existing = content?.skills ?? {};
    updateField({
      skills: {
        ...existing,
        [`Category ${Object.keys(existing).length + 1}`]: ["skill"],
      },
    });
  };
  const removeSkillCategory = (cat: string) => {
    const updated: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(content?.skills ?? {})) {
      if (k !== cat) updated[k] = v;
    }
    updateField({ skills: updated });
  };

  const updateEdu = (
    i: number,
    key: keyof NonNullable<GeneratedContent["education"]>[number],
    val: string,
  ) => {
    updateField({
      education: (content?.education ?? []).map((e, idx) =>
        idx === i ? { ...e, [key]: val } : e,
      ),
    });
  };
  const addEducation = () => {
    updateField({
      education: [
        ...(content?.education ?? []),
        {
          degree: "Degree / Program",
          institution: "University Name",
          period: "2020 – 2024",
        },
      ],
    });
  };
  const removeEducation = (i: number) => {
    updateField({
      education: (content?.education ?? []).filter((_, idx) => idx !== i),
    });
  };

  const updateCert = (
    i: number,
    key: keyof NonNullable<GeneratedContent["certifications"]>[number],
    val: string,
  ) => {
    updateField({
      certifications: (content?.certifications ?? []).map((c, idx) =>
        idx === i ? { ...c, [key]: val } : c,
      ),
    });
  };
  const addCertification = () => {
    updateField({
      certifications: [
        ...(content?.certifications ?? []),
        {
          name: "Certification Name",
          issuer: "Issuing Organization",
          date: "2024",
        },
      ],
    });
  };
  const removeCertification = (i: number) => {
    updateField({
      certifications: (content?.certifications ?? []).filter(
        (_, idx) => idx !== i,
      ),
    });
  };

  const delBtn: React.CSSProperties = {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#999",
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    lineHeight: 1,
  };

  const normalizedSkills = normalizeSkills(content?.skills);
  const showExperience =
    editable || (content?.experience && content.experience.length > 0);
  const showProjects =
    editable || (content?.projects && content.projects.length > 0);
  const showResearchPapers =
    editable ||
    (content?.researchPapers && content.researchPapers.length > 0);
  const showSkills =
    normalizedSkills && Object.keys(normalizedSkills).length > 0;
  const showEducation =
    editable || (content?.education && content.education.length > 0);
  const showCertifications =
    editable || (content?.certifications && content.certifications.length > 0);

  const sectionProps = {
    headingSize: styleSettings.headingSize,
    fontFamily: styleSettings.fontFamily,
    lineHeight: styleSettings.lineHeight,
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          width: "100%",
          height: A4_H * scale,
          minHeight: A4_H * scale,
          position: "relative",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: stripWidth,
            height: A4_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
        >
          <div
            style={{
              position: "relative",
              left: -pageOffset,
              width: stripWidth,
              height: A4_H,
              transition: "left 180ms ease-out",
            }}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  left: index * pageSpan,
                  width: A4_W,
                  height: A4_H,
                  background: "#fff",
                  boxShadow:
                    index === safeCurrentPage - 1
                      ? "0 0 0 1px rgba(0,0,0,0.06)"
                      : "none",
                }}
              />
            ))}
            <div
              ref={(el) => {
                (
                  pageRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = el;
                (
                  flowRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = el;
                if (mergedPageRef !== pageRef && mergedPageRef) {
                  (
                    mergedPageRef as React.MutableRefObject<HTMLDivElement | null>
                  ).current = el;
                }
              }}
              className={`resume-a4-page resume-template--${previewTemplateId}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: A4_W,
                height: A4_H,
                background: "transparent",
                padding: `${styleSettings.margins}px`,
                boxSizing: "border-box",
                fontFamily: styleSettings.fontFamily,
                fontSize: bodyPx,
                color: "#111",
                lineHeight: styleSettings.lineHeight,
                overflow: "visible",
                overflowWrap: "break-word",
                hyphens: "auto",
                orphans: 2,
                widows: 2,
                columnWidth: contentColumnWidth,
                columnGap: styleSettings.margins * 2 + PAGE_GAP,
                columnFill: "auto",
              }}
            >
              {/* Header */}
              <div
                style={{
                  textAlign: isTechnical || isExecutive ? "left" : "center",
                  marginBottom: isExecutive ? 28 : isClassic ? 18 : 22,
                  borderBottom: isTechnical
                    ? "2px solid #23395b"
                    : isExecutive
                      ? "1px solid #d8d8d8"
                      : undefined,
                  paddingBottom: isTechnical || isExecutive ? 12 : undefined,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <h1
                  style={{
                    fontFamily: isExecutive ? '"Georgia", "Times New Roman", serif' : styleSettings.fontFamily,
                    fontWeight: isTechnical || isClassic ? 700 : 400,
                    fontSize: isClassic ? namePx + 2 : isTechnical ? namePx + 4 : namePx,
                    margin: 0,
                    letterSpacing: isClassic ? "0.03em" : 0,
                    textTransform: isClassic ? "uppercase" : "none",
                    color: "#111",
                    lineHeight: 1.08,
                  }}
                >
                  {user?.full_name || "Your Name"}
                </h1>

                {(isTechnical || isExecutive) && (resume.job_title || resume.company_name) && (
                  <div
                    style={{
                      fontFamily: styleSettings.fontFamily,
                      fontSize: bodyPx,
                      fontWeight: isTechnical ? 600 : 400,
                      color: isTechnical ? "#46566f" : "#444",
                      marginTop: 4,
                    }}
                  >
                    {[resume.job_title, resume.company_name].filter(Boolean).join(" · ")}
                  </div>
                )}

                {/* Contact row: email | phone | location */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: isTechnical || isExecutive ? "flex-start" : "center",
                    gap: "5px 8px",
                    marginTop: 8,
                  }}
                >
                  {user?.email && (
                    <ResumeContactRow
                      icon={<Mail size={13} />}
                      value={user.email}
                      href={`mailto:${user.email}`}
                      bodySize={styleSettings.bodySize}
                      fontFamily={styleSettings.fontFamily}
                    />
                  )}
                  {user?.email && user?.phone_number && <ContactSeparator />}
                  {user?.phone_number && (
                    <ResumeContactRow
                      icon={<Phone size={12} />}
                      value={user.phone_number}
                      href={`tel:${user.phone_number.replace(/\s+/g, "")}`}
                      bodySize={styleSettings.bodySize}
                      fontFamily={styleSettings.fontFamily}
                    />
                  )}
                  {(user?.email || user?.phone_number) && user?.location && (
                    <ContactSeparator />
                  )}
                  {user?.location && (
                    <ResumeContactRow
                      icon={<MapPin size={12} />}
                      value={user.location}
                      bodySize={styleSettings.bodySize}
                      fontFamily={styleSettings.fontFamily}
                    />
                  )}
                </div>

                {/* Social row: GitHub | LinkedIn | Portfolio */}
                {(user?.github_url ||
                  user?.linkedin_url ||
                  user?.portfolio_url) && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: isTechnical || isExecutive ? "flex-start" : "center",
                      gap: "5px 8px",
                      marginTop: 5,
                    }}
                  >
                    {user?.github_url && (
                      <ResumeContactRow
                        icon={<Github size={13} />}
                        value={extractGithubUsername(user.github_url)}
                        href={ensureUrl(user.github_url)}
                        bodySize={styleSettings.bodySize}
                        fontFamily={styleSettings.fontFamily}
                      />
                    )}
                    {user?.github_url && user?.linkedin_url && (
                      <ContactSeparator />
                    )}
                    {user?.linkedin_url && (
                      <ResumeContactRow
                        icon={<Linkedin size={13} />}
                        value={extractLinkedinUsername(user.linkedin_url)}
                        href={ensureUrl(user.linkedin_url)}
                        bodySize={styleSettings.bodySize}
                        fontFamily={styleSettings.fontFamily}
                      />
                    )}
                    {(user?.github_url || user?.linkedin_url) &&
                      user?.portfolio_url && <ContactSeparator />}
                    {user?.portfolio_url && (
                      <ResumeContactRow
                        icon={<Globe size={13} />}
                        value={stripProtocol(user.portfolio_url)}
                        href={ensureUrl(user.portfolio_url)}
                        bodySize={styleSettings.bodySize}
                        fontFamily={styleSettings.fontFamily}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              {content?.summary !== undefined && (
                <ResumePSection title={summaryTitle} {...sectionProps}>
                  <p
                    contentEditable={editable || undefined}
                    suppressContentEditableWarning
                    onBlur={
                      editable
                        ? (e) =>
                            updateField({
                              summary: e.currentTarget.textContent ?? "",
                            })
                        : undefined
                    }
                    style={{
                      fontSize: bodyPx,
                      lineHeight: styleSettings.lineHeight,
                      color: "#111",
                      margin: 0,
                      outline: "none",
                      textAlign: "justify",
                      orphans: 2,
                      widows: 2,
                    }}
                  >
                    {content.summary}
                  </p>
                </ResumePSection>
              )}

              {isExecutive && normalizedSkills && Object.keys(normalizedSkills).length > 0 && (
                <ResumePSection title="Key Strengths" {...sectionProps}>
                  <p
                    style={{
                      fontSize: bodyPx,
                      lineHeight: styleSettings.lineHeight,
                      color: "#222",
                      margin: 0,
                    }}
                  >
                    {Object.values(normalizedSkills).flat().slice(0, 12).join(" · ")}
                  </p>
                </ResumePSection>
              )}

              {/* Experience */}
              {showExperience && (
                <ResumePSection
                  title="Experience"
                  onAddItem={editable ? addExperience : undefined}
                  {...sectionProps}
                >
                  {(content?.experience ?? []).map((e, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 12,
                        position: "relative",
                        breakInside: "auto",
                        pageBreakInside: "auto",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) max-content",
                          gap: 18,
                          alignItems: "start",
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                          breakAfter: "avoid",
                          pageBreakAfter: "avoid",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: bodyPx,
                              color: "#111",
                              display: "inline",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <EditableSpan
                              value={e.role ?? ""}
                              editable={editable}
                              onSave={(v) => updateExp(i, "role", v)}
                            />
                          </span>
                          {e.company && (
                            <EditableSpan
                              value={e.company}
                              editable={editable}
                              onSave={(v) => updateExp(i, "company", v)}
                              block
                              style={{
                                fontSize: bodyPx,
                                color: "#111",
                                marginTop: 1,
                              }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            textAlign: "right",
                          }}
                        >
                          <EditableSpan
                            value={e.period ?? ""}
                            editable={editable}
                            onSave={(v) => updateExp(i, "period", v)}
                            style={{
                              fontSize: bodyPx - 1,
                              color: "#111",
                              fontStyle: "italic",
                            }}
                          />
                          {editable && (
                            <button
                              style={delBtn}
                              onClick={() => removeExperience(i)}
                            >
                              <X size={8} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      </div>
                      {e.bullets && e.bullets.length > 0 && (
                        <ul style={{ margin: "5px 0 0", paddingLeft: 24 }}>
                          {e.bullets.map((b, j) => (
                            <li
                              key={j}
                              style={{
                                fontSize: bodyPx,
                                lineHeight: styleSettings.lineHeight,
                                color: "#111",
                                marginBottom: 3,
                                paddingLeft: 2,
                                breakInside: "avoid",
                                pageBreakInside: "avoid",
                              }}
                            >
                              <EditableSpan
                                value={b}
                                editable={editable}
                                onSave={(v) => updateExpBullet(i, j, v)}
                                style={{ flex: 1 }}
                              />
                              {editable && (
                                <button
                                  style={{ ...delBtn, marginTop: 1 }}
                                  onClick={() => removeExpBullet(i, j)}
                                >
                                  <X size={7} strokeWidth={2} />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {editable && (
                        <button
                          onClick={() => addExpBullet(i)}
                          style={{
                            ...delBtn,
                            color: "#ccc",
                            fontSize: 8,
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Plus size={7} strokeWidth={2} /> bullet
                        </button>
                      )}
                    </div>
                  ))}
                </ResumePSection>
              )}

              {/* Projects */}
              {showProjects && (
                <ResumePSection
                  title={projectsTitle}
                  onAddItem={editable ? addProject : undefined}
                  {...sectionProps}
                >
                  {(content?.projects ?? []).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 13,
                        breakInside: "auto",
                        pageBreakInside: "auto",
                      }}
                    >
                      {/* Name row: project name (flex-grow) + optional link + delete */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 8,
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                          breakAfter: "avoid",
                          pageBreakAfter: "avoid",
                        }}
                      >
                        <EditableSpan
                          value={p.name ?? ""}
                          editable={editable}
                          onSave={(v) => updateProj(i, "name", v)}
                          style={{
                            fontWeight: 700,
                            fontSize: bodyPx,
                            color: "#111",
                            overflowWrap: "anywhere",
                            flex: "1 1 0",
                            minWidth: 0,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            flexShrink: 0,
                          }}
                        >
                          {getProjectHref(p) && (
                            <a
                              href={ensureUrl(getProjectHref(p))}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: bodyPx - 1,
                                color: ACADEMIC_LINK_BLUE,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Link ↗
                            </a>
                          )}
                          {editable && (
                            <button
                              style={delBtn}
                              onClick={() => removeProject(i)}
                            >
                              <X size={8} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Tech stack on its own line */}
                      {p.tech_stack && p.tech_stack.length > 0 && (
                        <div
                          style={{
                            marginTop: 1,
                            breakInside: "avoid",
                            pageBreakInside: "avoid",
                            breakAfter: "avoid",
                            pageBreakAfter: "avoid",
                          }}
                        >
                          <EditableSpan
                            value={p.tech_stack.join(" · ")}
                            editable={editable}
                            onSave={(v) => updateProjTech(i, v)}
                            style={{
                              fontSize: bodyPx - 1,
                              color: "#444",
                              fontStyle: "italic",
                              overflowWrap: "anywhere",
                            }}
                          />
                        </div>
                      )}
                      {p.description && (
                        <EditableSpan
                          value={p.description}
                          editable={editable}
                          onSave={(v) => updateProj(i, "description", v)}
                          block
                          style={{
                            fontSize: bodyPx,
                            color: "#111",
                            margin: "3px 0 2px",
                            outline: "none",
                            breakInside: "auto",
                            pageBreakInside: "auto",
                            breakAfter: "avoid",
                            pageBreakAfter: "avoid",
                            orphans: 2,
                            widows: 2,
                          }}
                        />
                      )}
                      {p.bullets && p.bullets.length > 0 && (
                        <ul style={{ margin: "4px 0 0", paddingLeft: 24 }}>
                          {p.bullets.map((b, j) => (
                            <li
                              key={j}
                              style={{
                                fontSize: bodyPx,
                                lineHeight: styleSettings.lineHeight,
                                color: "#111",
                                marginBottom: 3,
                                paddingLeft: 2,
                                breakInside: "avoid",
                                pageBreakInside: "avoid",
                              }}
                            >
                              <EditableSpan
                                value={b}
                                editable={editable}
                                onSave={(v) => updateProjBullet(i, j, v)}
                                style={{ flex: 1 }}
                              />
                              {editable && (
                                <button
                                  style={{ ...delBtn, marginTop: 1 }}
                                  onClick={() => removeProjBullet(i, j)}
                                >
                                  <X size={7} strokeWidth={2} />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </ResumePSection>
              )}

              {/* Research Papers */}
              {showResearchPapers && (
                <ResumePSection
                  title="Research Papers"
                  onAddItem={editable ? addResearchPaper : undefined}
                  {...sectionProps}
                >
                  {(content?.researchPapers ?? []).map((paper, i) => {
                    const venueParts = [
                      paper.venue,
                      paper.year || paper.date,
                      paper.status,
                    ].filter(Boolean);
                    const linkRows = [
                      paper.doi ? `DOI: ${paper.doi}` : "",
                      paper.arxivUrl ? `arXiv: ${paper.arxivUrl}` : "",
                      paper.publicationUrl
                        ? `Publication: ${paper.publicationUrl}`
                        : "",
                      paper.githubUrl ? `Code: ${paper.githubUrl}` : "",
                    ].filter(Boolean);

                    return (
                      <div
                        key={i}
                        style={{
                          marginBottom: 13,
                          breakInside: "auto",
                          pageBreakInside: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 8,
                            breakInside: "avoid",
                            pageBreakInside: "avoid",
                            breakAfter: "avoid",
                            pageBreakAfter: "avoid",
                          }}
                        >
                          <EditableSpan
                            value={paper.title ?? ""}
                            editable={editable}
                            onSave={(v) => updateResearchPaper(i, "title", v)}
                            style={{
                              fontWeight: 700,
                              fontSize: bodyPx,
                              color: "#111",
                              overflowWrap: "anywhere",
                              flex: "1 1 0",
                              minWidth: 0,
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexShrink: 0,
                            }}
                          >
                            {getResearchPaperHref(paper) && (
                              <a
                                href={ensureUrl(getResearchPaperHref(paper))}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: bodyPx - 1,
                                  color: ACADEMIC_LINK_BLUE,
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Paper ↗
                              </a>
                            )}
                            {editable && (
                              <button
                                style={delBtn}
                                onClick={() => removeResearchPaper(i)}
                              >
                                <X size={8} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </div>

                        {paper.authors && paper.authors.length > 0 && (
                          <EditableSpan
                            value={paper.authors.join(", ")}
                            editable={editable}
                            onSave={(v) => updateResearchAuthors(i, v)}
                            block
                            style={{
                              fontSize: bodyPx - 1,
                              color: "#444",
                              marginTop: 1,
                              overflowWrap: "anywhere",
                            }}
                          />
                        )}

                        {venueParts.length > 0 && (
                          <div
                            style={{
                              fontSize: bodyPx - 1,
                              color: "#444",
                              fontStyle: "italic",
                              marginTop: 1,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            <EditableSpan
                              value={paper.venue ?? ""}
                              editable={editable}
                              onSave={(v) => updateResearchPaper(i, "venue", v)}
                            />
                            {(paper.year || editable) && (
                              <>
                                <span>{paper.venue || editable ? "·" : ""}</span>
                                <EditableSpan
                                  value={paper.year ?? ""}
                                  editable={editable}
                                  onSave={(v) =>
                                    updateResearchPaper(i, "year", v)
                                  }
                                />
                              </>
                            )}
                            {(paper.status || editable) && (
                              <>
                                <span>
                                  {paper.venue || paper.year || editable
                                    ? "·"
                                    : ""}
                                </span>
                                <EditableSpan
                                  value={paper.status ?? ""}
                                  editable={editable}
                                  onSave={(v) =>
                                    updateResearchPaper(i, "status", v)
                                  }
                                />
                              </>
                            )}
                          </div>
                        )}

                        {paper.description && (
                          <EditableSpan
                            value={paper.description}
                            editable={editable}
                            onSave={(v) =>
                              updateResearchPaper(i, "description", v)
                            }
                            block
                            style={{
                              fontSize: bodyPx,
                              color: "#111",
                              margin: "3px 0 2px",
                              outline: "none",
                              breakInside: "auto",
                              pageBreakInside: "auto",
                              breakAfter: "avoid",
                              pageBreakAfter: "avoid",
                              orphans: 2,
                              widows: 2,
                            }}
                          />
                        )}

                        {paper.keywords && paper.keywords.length > 0 && (
                          <EditableSpan
                            value={paper.keywords.join(", ")}
                            editable={editable}
                            onSave={(v) => updateResearchKeywords(i, v)}
                            block
                            style={{
                              fontSize: bodyPx - 1,
                              color: "#444",
                              marginTop: 2,
                            }}
                          />
                        )}

                        {linkRows.length > 0 && (
                          <div
                            style={{
                              fontSize: bodyPx - 1,
                              color: ACADEMIC_LINK_BLUE,
                              marginTop: 2,
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {linkRows.map((linkText) => (
                              <span key={linkText}>{linkText}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ResumePSection>
              )}

              {/* Skills */}
              {showSkills && (
                <ResumePSection
                  title={skillsTitle}
                  onAddItem={editable ? addSkillCategory : undefined}
                  {...sectionProps}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {Object.entries(normalizedSkills!).map(([cat, skills]) => (
                      <div
                        key={cat}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "145px minmax(0, 1fr) max-content",
                          gap: 8,
                          alignItems: "start",
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <EditableSpan
                          value={cat}
                          editable={editable}
                          onSave={(v) => updateSkillCat(cat, v)}
                          style={{
                            fontWeight: 700,
                            fontSize: bodyPx,
                            color: "#111",
                            paddingTop: 1,
                          }}
                        />
                        <EditableSpan
                          value={skills.join(", ")}
                          editable={editable}
                          onSave={(v) => updateSkillValues(cat, v)}
                          style={{
                            fontSize: bodyPx,
                            color: "#111",
                            minWidth: 0,
                          }}
                        />
                        {editable && (
                          <button
                            style={delBtn}
                            onClick={() => removeSkillCategory(cat)}
                          >
                            <X size={8} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </ResumePSection>
              )}

              {/* Education */}
              {showEducation && (
                <ResumePSection
                  title="Education"
                  onAddItem={editable ? addEducation : undefined}
                  {...sectionProps}
                >
                  {(content?.education ?? []).map((e, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: e.gpa
                          ? "minmax(65px, auto) minmax(0, 1fr) max-content"
                          : "minmax(65px, auto) minmax(0, 1fr)",
                        gap: 14,
                        alignItems: "start",
                        marginBottom: 11,
                        breakInside: "avoid",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "start",
                          gap: 4,
                          fontSize: bodyPx - 1,
                          color: "#111",
                          fontStyle: "italic",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <EditableSpan
                          value={e.period ?? ""}
                          editable={editable}
                          onSave={(v) => updateEdu(i, "period", v)}
                        />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <EditableSpan
                          value={e.degree ?? ""}
                          editable={editable}
                          onSave={(v) => updateEdu(i, "degree", v)}
                          style={{
                            fontWeight: 700,
                            fontSize: bodyPx,
                            color: "#111",
                            overflowWrap: "anywhere",
                          }}
                        />
                        <div
                          style={{
                            fontSize: bodyPx,
                            color: "#111",
                            marginTop: 1,
                          }}
                        >
                          <EditableSpan
                            value={e.institution ?? ""}
                            editable={editable}
                            onSave={(v) => updateEdu(i, "institution", v)}
                          />
                        </div>
                      </div>
                      {e.gpa && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "start",
                            gap: 4,
                            fontSize: bodyPx - 1,
                            color: "#111",
                            fontStyle: "italic",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <EditableSpan
                            value={e.gpa}
                            editable={editable}
                            onSave={(v) => updateEdu(i, "gpa", v)}
                          />
                          {editable && (
                            <button
                              style={delBtn}
                              onClick={() => removeEducation(i)}
                            >
                              <X size={8} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      )}
                      {!e.gpa && editable && (
                        <button
                          style={delBtn}
                          onClick={() => removeEducation(i)}
                        >
                          <X size={8} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                </ResumePSection>
              )}

              {/* Certifications — only shown when there is content, or in edit mode */}
              {showCertifications && (
                <ResumePSection
                  title="Certifications"
                  onAddItem={editable ? addCertification : undefined}
                  {...sectionProps}
                >
                  {(content?.certifications ?? []).map((c, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: bodyPx,
                        marginBottom: 5,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        breakInside: "avoid",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <EditableSpan
                          value={c.name ?? ""}
                          editable={editable}
                          onSave={(v) => updateCert(i, "name", v)}
                          style={{ fontWeight: 700 }}
                        />
                        {c.issuer && (
                          <>
                            {" "}
                            —{" "}
                            <EditableSpan
                              value={c.issuer}
                              editable={editable}
                              onSave={(v) => updateCert(i, "issuer", v)}
                            />
                          </>
                        )}
                        {c.date && (
                          <>
                            {" "}
                            (
                            <EditableSpan
                              value={c.date}
                              editable={editable}
                              onSave={(v) => updateCert(i, "date", v)}
                              style={{ fontStyle: "italic" }}
                            />
                            )
                          </>
                        )}
                      </div>
                      {editable && (
                        <button
                          style={delBtn}
                          onClick={() => removeCertification(i)}
                        >
                          <X size={8} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                </ResumePSection>
              )}

              {!content && (
                <div
                  style={{
                    color: "#aaa",
                    fontSize: 11,
                    textAlign: "center",
                    paddingTop: 80,
                  }}
                >
                  Resume content is being generated…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({
  onClose,
  pdfUrl,
}: {
  onClose: () => void;
  pdfUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!pdfUrl) return;
    navigator.clipboard.writeText(pdfUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "40px 40px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            insetInline: 0,
            top: 0,
            height: 5,
            background:
              "linear-gradient(90deg, var(--brass-400), var(--brass-600))",
          }}
        />
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}
        >
          <Seal size={150} />
        </div>
        <Badge tone="success" dot>
          Signed
        </Badge>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 30,
            color: "var(--ink-900)",
            margin: "12px 0 6px",
            letterSpacing: "-0.01em",
          }}
        >
          Your resume is signed.
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "var(--slate-700)",
            margin: "0 auto 24px",
            maxWidth: 320,
          }}
        >
          Crafted around who you are — and ready for who you'll become. Export
          it as a pixel-perfect PDF.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {pdfUrl ? (
            <a href={pdfUrl} download target="_blank" rel="noreferrer">
              <Button
                variant="gold"
                iconLeft={<Download size={16} strokeWidth={1.9} />}
              >
                Download PDF
              </Button>
            </a>
          ) : (
            <Button
              variant="gold"
              iconLeft={<Download size={16} strokeWidth={1.9} />}
              disabled
            >
              PDF not available
            </Button>
          )}
          <Button
            variant="secondary"
            iconLeft={<Link size={16} strokeWidth={1.9} />}
            onClick={copyLink}
            disabled={!pdfUrl}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--slate-400)",
          }}
        >
          <X size={20} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({
  msg,
  type = "success",
}: {
  msg: string;
  type?: "success" | "error";
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        background:
          type === "error" ? "var(--danger-600, #dc2626)" : "var(--ink-900)",
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
      }}
    >
      {type === "success" ? (
        <Check size={15} strokeWidth={2} />
      ) : (
        <AlertTriangle size={15} strokeWidth={2} />
      )}
      {msg}
    </div>
  );
}

// ─── Page navigator ────────────────────────────────────────────────────────────

function PageNavigator({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  const btnBase: React.CSSProperties = {
    border: "1.5px solid var(--line-300)",
    background: "transparent",
    borderRadius: "var(--radius-sm)",
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--slate-600)",
    transition: "background 0.15s",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 16,
        padding: "10px 0",
      }}
    >
      <button
        style={{
          ...btnBase,
          opacity: currentPage <= 1 ? 0.35 : 1,
          cursor: currentPage <= 1 ? "default" : "pointer",
        }}
        onClick={onPrev}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} strokeWidth={1.9} />
      </button>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 13,
          color: "var(--slate-600)",
          minWidth: 80,
          textAlign: "center",
        }}
      >
        Page {currentPage} of {totalPages}
      </span>
      <button
        style={{
          ...btnBase,
          opacity: currentPage >= totalPages ? 0.35 : 1,
          cursor: currentPage >= totalPages ? "default" : "pointer",
        }}
        onClick={onNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} strokeWidth={1.9} />
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("resume");
  const [exporting, setExporting] = useState(false);
  const [exportPreparing, setExportPreparing] = useState(false);
  const [exportPdfUrl, setExportPdfUrl] = useState<string | undefined>(
    undefined,
  );
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverContent, setCoverContent] = useState<string | null>(null);
  const [coverTone, setCoverTone] = useState("balanced");
  const [coverWhyThis, setCoverWhyThis] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [editableContent, setEditableContent] = useState<
    GeneratedContent | undefined
  >(undefined);
  const [styleSettings, setStyleSettings] =
    useState<StyleSettings>(DEFAULT_STYLE);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const paperRef = useRef<HTMLDivElement>(null);

  const { data: resumeData, loading: resumeLoading } = useApi<ResumeVersion>(
    id ? EP.resume(id) : "",
  );
  const { data: atsData, loading: atsLoading } = useApi<AtsResult>(
    id ? EP.ats(id) : "",
  );

  const resume = resumeData;
  const content = resume?.generated_content;
  const normalizedContent = resume
    ? normalizeContentForPreview(content, resume)
    : content;

  useEffect(() => {
    if (normalizedContent && editableContent === undefined)
      setEditableContent(normalizedContent);
  }, [normalizedContent, editableContent]);

  useEffect(() => {
    if (!normalizedContent) return;
    setEditableContent(normalizedContent);
    setStyleSettings(getTemplateStyleSettings(resume?.template_id));
    setCurrentPage(1);
  }, [resume?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayContent = editableContent ?? normalizedContent;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const saveEdits = async () => {
    if (!id || !editableContent) return;
    setSaving(true);
    try {
      await api.patch(EP.resumeContent(id), {
        generated_content: editableContent,
      });
      showToast("Changes saved successfully.");
      setEditMode(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Save failed. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const discardEdits = () => {
    setEditableContent(normalizedContent);
    setEditMode(false);
  };

  const atsScore = atsData?.atsScore ?? (resume ? Number(resume.ats_score) : 0);
  const atsFeedback = atsData?.atsFeedback ?? resume?.ats_feedback ?? {};
  const foundKeywords = atsFeedback?.foundKeywords ?? [];
  const missingKeywords = atsFeedback?.missingKeywords ?? [];
  const suggestions = atsFeedback?.suggestions ?? [];
  const jobTitle = atsData?.jobTitle ?? resume?.job_title ?? "";
  const companyName = atsData?.companyName ?? resume?.company_name ?? "";

  const [duplicating, setDuplicating] = useState(false);
  const duplicateResume = async () => {
    if (!id || duplicating) return;
    setDuplicating(true);
    try {
      await api.post(`${EP.resume(id)}/duplicate`);
      navigate("/resumes");
    } catch {
      showToast("Duplicate failed.", "error");
    } finally {
      setDuplicating(false);
    }
  };

  const prepareExport = async () => {
    if (!id || exportPreparing) return;
    setExportPreparing(true);
    try {
      const r = await api.get<{ url: string }>(EP.resumeExport(id));
      setExportPdfUrl(r.data.url);
      setExporting(true);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Export failed. Please try again.",
        "error",
      );
    } finally {
      setExportPreparing(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!id) return;
    setCoverLoading(true);
    try {
      const r = await api.post<CoverLetterData>(EP.coverLetter(id), {
        tone: coverTone,
        whyCompany: coverWhyThis || "I am excited about this opportunity.",
      });
      setCoverContent(r.data.content ?? "");
    } catch {
      setCoverContent("Cover letter generation failed. Please try again.");
    } finally {
      setCoverLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage((page) => Math.max(1, Math.min(totalPages, page)));
  }, [totalPages]);

  if (resumeLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid var(--paper-300)",
            borderTopColor: "var(--brass-500)",
            animation: "sig-spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--slate-500)",
          }}
        >
          Loading resume…
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "var(--slate-500)",
          }}
        >
          Resume not found.
        </div>
        <Button variant="secondary" onClick={() => navigate("/resumes")}>
          Back to resumes
        </Button>
      </div>
    );
  }

  return (
    <PageContainer
      variant="wide"
      style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
    >
      {/* Sub-header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0 16px",
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate("/resumes")}
            style={{
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid var(--line-300)",
              background: "transparent",
              borderRadius: "var(--radius-sm)",
              color: "var(--slate-600)",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={17} strokeWidth={1.9} />
          </button>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink-900)",
                lineHeight: 1.1,
              }}
            >
              {resume.version_label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--slate-500)",
              }}
            >
              {jobTitle}
              {companyName ? ` · ${companyName}` : ""}
              {resume.template_id ? ` · ${getResumeTemplateLabel(resume.template_id)}` : ""} ·{" "}
              {resume.page_length}
            </div>
          </div>
          <Badge tone="neutral">
            {resume.status === "draft" ? "Draft" : resume.status}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {editMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={discardEdits}>
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Save size={14} strokeWidth={1.9} />}
                onClick={saveEdits}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={showStylePanel ? "primary" : "secondary"}
                size="sm"
                iconLeft={<Settings2 size={14} strokeWidth={1.9} />}
                onClick={() => {
                  setShowStylePanel((v) => !v);
                  setEditMode(false);
                }}
              >
                Customize
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Pencil size={14} strokeWidth={1.9} />}
                onClick={() => {
                  setEditMode(true);
                  setShowStylePanel(false);
                }}
              >
                Quick edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<LayoutTemplate size={14} strokeWidth={1.9} />}
                onClick={() => navigate(`/resumes/${id}/edit`)}
              >
                Full editor
              </Button>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Copy size={14} strokeWidth={1.9} />}
                onClick={duplicateResume}
                disabled={duplicating}
              >
                {duplicating ? "Duplicating…" : "Duplicate"}
              </Button>
              <Button
                variant="gold"
                size="sm"
                iconLeft={<Stamp size={15} strokeWidth={1.9} />}
                onClick={prepareExport}
                disabled={exportPreparing}
              >
                {exportPreparing ? "Preparing…" : "Sign & Export"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        items={[
          { id: "resume", label: "Resume" },
          { id: "cover", label: "Cover Letter" },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 0 }}
      />

      <div className="sig-resume-workspace" style={{ flex: 1, marginTop: 24 }}>
        {/* A4 paper preview */}
        <div>
          {tab === "resume" ? (
            <div
              style={{
                background: "var(--paper-200)",
                borderRadius: "var(--radius-md)",
                padding: 24,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {displayContent && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: editMode
                      ? "var(--brass-700)"
                      : showStylePanel
                        ? "var(--ink-600)"
                        : "var(--slate-400)",
                  }}
                >
                  {editMode ? (
                    <>
                      <Pencil size={12} strokeWidth={1.9} />
                      <span>
                        Edit mode active — click any text to edit, use + / × to
                        add or remove items
                      </span>
                    </>
                  ) : showStylePanel ? (
                    <>
                      <Settings2 size={12} strokeWidth={1.9} />
                      <span>
                        Adjusting style — changes reflect instantly in the
                        preview
                      </span>
                    </>
                  ) : (
                    <>
                      <Pencil size={12} strokeWidth={1.9} />
                      <span>
                        Click <strong>Quick edit</strong> to modify content or{" "}
                        <strong>Customize</strong> to adjust style
                      </span>
                    </>
                  )}
                </div>
              )}
              <div
                style={{
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  borderRadius: 2,
                }}
              >
                <A4ResumePreview
                  content={displayContent}
                  resume={resume}
                  user={user}
                  onContentChange={editMode ? setEditableContent : undefined}
                  editable={editMode}
                  styleSettings={styleSettings}
                  onPagesChange={setTotalPages}
                  paperRef={paperRef}
                  currentPage={currentPage}
                />
              </div>
              <PageNavigator
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
                onNext={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              />
            </div>
          ) : (
            <div
              style={{
                background: "var(--white)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "52px 56px",
                minHeight: 780,
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--slate-700)",
              }}
            >
              {coverContent ? (
                <>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 600,
                      color: "var(--ink-900)",
                      marginBottom: 24,
                    }}
                  >
                    Cover Letter
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{coverContent}</div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "var(--slate-400)",
                  }}
                >
                  Generate a cover letter using the panel →
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside>
          {tab === "resume" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* ATS score panel */}
              <div
                style={{
                  background: "var(--surface-raised)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid var(--brass-200)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    insetInline: 0,
                    top: 0,
                    height: 4,
                    background:
                      "linear-gradient(90deg, var(--brass-400), var(--brass-600))",
                  }}
                />
                <div
                  style={{
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 22,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {atsLoading ? (
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "var(--slate-400)",
                        }}
                      >
                        Calculating…
                      </div>
                    ) : (
                      <>
                        <ScoreRing value={Math.round(atsScore || 0)} />
                        <div
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--slate-700)",
                          }}
                        >
                          ATS match score
                        </div>
                      </>
                    )}
                  </div>

                  {foundKeywords.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 10,
                        }}
                      >
                        <Check
                          size={15}
                          strokeWidth={1.9}
                          color="var(--success-600)"
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--slate-700)",
                          }}
                        >
                          Matched keywords
                        </span>
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {foundKeywords.map((k) => (
                          <Tag key={k} tone="blue">
                            {k}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {missingKeywords.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 10,
                        }}
                      >
                        <AlertTriangle
                          size={15}
                          strokeWidth={1.9}
                          color="var(--danger-600)"
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--slate-700)",
                          }}
                        >
                          Missing keywords
                        </span>
                      </div>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {missingKeywords.map((k) => (
                          <Tag key={k} tone="neutral">
                            {k}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 10,
                        }}
                      >
                        <Lightbulb
                          size={15}
                          strokeWidth={1.9}
                          color="var(--brass-700)"
                        />
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--slate-700)",
                          }}
                        >
                          Suggestions
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 8,
                              fontFamily: "var(--font-body)",
                              fontSize: 12.5,
                              lineHeight: 1.45,
                              color: "var(--slate-700)",
                            }}
                          >
                            <Sparkle
                              size={13}
                              strokeWidth={1.9}
                              color="var(--brass-600)"
                              style={{ flexShrink: 0, marginTop: 1 }}
                            />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {foundKeywords.length === 0 &&
                    missingKeywords.length === 0 &&
                    suggestions.length === 0 &&
                    !atsLoading && (
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 13,
                          color: "var(--slate-400)",
                          textAlign: "center",
                        }}
                      >
                        ATS analysis data will appear here after generation.
                      </div>
                    )}
                </div>
              </div>

              {/* Quick Style Editor panel */}
              {showStylePanel && (
                <div
                  style={{
                    background: "var(--paper-100)",
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 16px 20px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--slate-500)",
                      marginBottom: 14,
                    }}
                  >
                    Style
                  </div>
                  <QuickStyleEditor
                    settings={styleSettings}
                    onChange={setStyleSettings}
                  />
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px",
                      background: "var(--paper-50)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--line-200)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 11.5,
                        color: "var(--slate-500)",
                        lineHeight: 1.5,
                      }}
                    >
                      Style changes apply to this preview only. For full layout
                      and typography control, open the{" "}
                      <button
                        onClick={() => navigate(`/resumes/${id}/edit`)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--brass-600)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontSize: "inherit",
                          fontWeight: 600,
                          padding: 0,
                          textDecoration: "underline",
                        }}
                      >
                        full editor
                      </button>
                      .
                    </div>
                  </div>
                </div>
              )}

              {/* Edit mode — add sections panel */}
              {editMode && (
                <div
                  style={{
                    background: "var(--paper-100)",
                    border: "1px solid var(--line-200)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--slate-500)",
                      marginBottom: 10,
                    }}
                  >
                    Add sections
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {[
                      {
                        label: "Add experience",
                        fn: () =>
                          setEditableContent((c) =>
                            c
                              ? {
                                  ...c,
                                  experience: [
                                    ...(c.experience ?? []),
                                    {
                                      role: "New Role",
                                      company: "Company",
                                      period: "2024 – Present",
                                      bullets: ["Describe your achievement"],
                                    },
                                  ],
                                }
                              : c,
                          ),
                      },
                      {
                        label: "Add project",
                        fn: () =>
                          setEditableContent((c) =>
                            c
                              ? {
                                  ...c,
                                  projects: [
                                    ...(c.projects ?? []),
                                    {
                                      name: "New Project",
                                      description: "Brief description",
                                      tech_stack: ["TypeScript"],
                                      bullets: [],
                                    },
                                  ],
                                }
                              : c,
                          ),
                      },
                      {
                        label: "Add education",
                        fn: () =>
                          setEditableContent((c) =>
                            c
                              ? {
                                  ...c,
                                  education: [
                                    ...(c.education ?? []),
                                    {
                                      degree: "Degree",
                                      institution: "Institution",
                                      period: "2020 – 2024",
                                    },
                                  ],
                                }
                              : c,
                          ),
                      },
                      {
                        label: "Add certification",
                        fn: () =>
                          setEditableContent((c) =>
                            c
                              ? {
                                  ...c,
                                  certifications: [
                                    ...(c.certifications ?? []),
                                    {
                                      name: "Certification",
                                      issuer: "Issuer",
                                      date: "2024",
                                    },
                                  ],
                                }
                              : c,
                          ),
                      },
                    ].map(({ label, fn }) => (
                      <button
                        key={label}
                        onClick={fn}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 10px",
                          background: "transparent",
                          border: "1px dashed var(--line-300)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--ink-600)",
                          fontFamily: "var(--font-body)",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Plus size={13} strokeWidth={1.9} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--ink-900)",
                }}
              >
                Shape your letter
              </div>
              <Select
                label="Tone"
                options={[
                  { value: "formal", label: "Formal" },
                  { value: "balanced", label: "Balanced" },
                  { value: "conversational", label: "Conversational" },
                ]}
                value={coverTone}
                onChange={(e) => setCoverTone(e.target.value)}
              />
              <Textarea
                label="Why this company?"
                rows={4}
                value={coverWhyThis}
                onChange={(e) => setCoverWhyThis(e.target.value)}
                placeholder={`Why do you want to work at ${companyName || "this company"}?`}
              />
              <Button
                variant="gold"
                block
                iconLeft={<Sparkle size={16} strokeWidth={1.9} />}
                disabled={coverLoading}
                onClick={generateCoverLetter}
              >
                {coverLoading ? "Generating…" : "Generate cover letter"}
              </Button>
            </div>
          )}
        </aside>
      </div>

      {exporting && (
        <ExportModal
          onClose={() => setExporting(false)}
          pdfUrl={exportPdfUrl || resume?.pdf_signed_url}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </PageContainer>
  );
}
