import React, { useState } from "react";
import { X, Check, ChevronDown, ChevronUp, Loader2, User } from "lucide-react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Tag } from "@/components/data-display/Tag";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedPersonal {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  summary?: string;
}
export interface ParsedField<T> {
  value: T;
  confidence: number;
  sourceSection?: string;
  sourceText?: string;
  warnings?: string[];
}
export interface ParsedPersonalInfo {
  fullName?: ParsedField<string>;
  email?: ParsedField<string>;
  phone?: ParsedField<string>;
  location?: ParsedField<string>;
  linkedinUrl?: ParsedField<string>;
  githubUrl?: ParsedField<string>;
  portfolioUrl?: ParsedField<string>;
  professionalSummary?: ParsedField<string>;
}
export interface ParseWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  section?: string;
  field?: string;
}
export interface ExtractedLink {
  displayText?: string;
  url: string;
  normalizedUrl: string;
  kind?: string;
  section?: string;
  nearbyText?: string;
}
export interface ParsedItemMeta {
  confidence?: number;
  warnings?: string[];
  duplicate?: { isDuplicate: boolean; existingItemId?: string; reason?: string; action?: string };
}
export interface ParsedExperienceItem {
  title: string; company_name?: string; location?: string;
  start_date?: string; end_date?: string; is_current?: boolean;
  description?: string; bullets?: string[]; tech_stack?: string[]; achievements?: string; employment_type?: string;
  _meta?: ParsedItemMeta;
}
export interface ParsedEducationItem {
  title: string; degree?: string; field_of_study?: string; institution_name?: string;
  location?: string; start_date?: string; end_date?: string; is_current?: boolean;
  gpa?: string; description?: string; details?: string[]; _meta?: ParsedItemMeta;
}
export interface ParsedSkillItem { title: string; skill_name?: string; domain_category?: string; _meta?: ParsedItemMeta; }
export interface ParsedProjectItem {
  title: string; description?: string; bullets?: string[]; tech_stack?: string[]; project_url?: string;
  github_url?: string; live_url?: string; links?: ExtractedLink[];
  start_date?: string; end_date?: string; achievements?: string; impact_metrics?: string;
  _meta?: ParsedItemMeta;
}
export interface ParsedResearchPaperItem {
  title: string; authors?: string[]; venue?: string; publicationType?: "journal" | "conference" | "preprint" | "workshop" | "article" | "unknown";
  publisher?: string; year?: string; date?: string; doi?: string; arxivUrl?: string; publicationUrl?: string; githubUrl?: string;
  abstract?: string; keywords?: string[]; status?: "published" | "accepted" | "submitted" | "under_review" | "preprint" | "unknown";
  links?: ExtractedLink[]; _meta?: ParsedItemMeta;
}
export interface ParsedCertificationItem {
  title: string; issuing_org?: string; cert_url?: string; start_date?: string; end_date?: string; _meta?: ParsedItemMeta;
}
export interface ParsedResumeData {
  personalInfo?: ParsedPersonalInfo;
  personal?: ParsedPersonal;
  experience?: ParsedExperienceItem[];
  education?: ParsedEducationItem[];
  skills?: ParsedSkillItem[];
  projects?: ParsedProjectItem[];
  researchPapers?: ParsedResearchPaperItem[];
  certifications?: ParsedCertificationItem[];
  extractedLinks?: ExtractedLink[];
  warnings?: ParseWarning[];
  confidence?: {
    overall: number; personalInfo: number; education: number; experience: number;
    projects: number; researchPapers: number; skills: number; certifications: number;
  };
}

interface ResumeReviewModalProps {
  docId: string;
  filename: string;
  parsedData: ParsedResumeData;
  onClose: () => void;
  onApplied: () => void;
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const S = {
  label: {
    fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
    color: "var(--slate-500)", textTransform: "uppercase" as const,
    letterSpacing: "0.1em", marginBottom: 4,
  },
  card: (selected: boolean) => ({
    borderRadius: "var(--radius-md)",
    border: `1.5px solid ${selected ? "var(--ink-400)" : "var(--line-300)"}`,
    background: selected ? "var(--ink-100)" : "var(--paper-50)",
    padding: "14px 16px", cursor: "pointer",
    transition: "border-color 0.12s, background 0.12s", marginBottom: 10,
  }),
  row: { display: "flex", gap: 10, alignItems: "flex-start" } as React.CSSProperties,
  checkBox: (selected: boolean) => ({
    width: 20, height: 20, borderRadius: "var(--radius-sm)",
    border: `1.5px solid ${selected ? "var(--ink-600)" : "var(--line-300)"}`,
    background: selected ? "var(--ink-600)" : "var(--paper-50)",
    flexShrink: 0, marginTop: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--paper-50)",
  }),
};

const formatYear = (date?: string) => (date ? date.slice(0, 4) : "");

// ── Tab configuration ─────────────────────────────────────────────────────────

const TABS = [
  { id: "personal",       label: "Personal Info" },
  { id: "experience",     label: "Experience"    },
  { id: "education",      label: "Education"     },
  { id: "skills",         label: "Skills"        },
  { id: "projects",       label: "Projects"      },
  { id: "researchPapers", label: "Research Papers" },
  { id: "certifications", label: "Certifications"},
] as const;
type TabId = typeof TABS[number]["id"];

// ── CollapsibleItem ───────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const tone = score >= 0.8 ? "var(--success-600)" : score >= 0.6 ? "var(--brass-700)" : "var(--danger-600)";
  return <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, color: tone }}>{Math.round(score * 100)}%</span>;
}

function WarningList({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {warnings.map((warning) => (
        <div key={warning} style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--danger-600)" }}>
          Review required: {warning}
        </div>
      ))}
    </div>
  );
}

function CollapsibleItem({ title, subtitle, selected, confidence, warnings, onToggleSelect, children }: {
  title: string; subtitle?: string; selected: boolean;
  confidence?: number; warnings?: string[];
  onToggleSelect: () => void; children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={S.card(selected)}>
      <div style={S.row} onClick={onToggleSelect}>
        <span style={S.checkBox(selected)}>
          {selected && <Check size={12} strokeWidth={2.5} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)", display: "flex", gap: 8, alignItems: "center" }}>
            <span>{title}</span><ConfidenceBadge score={confidence} />
            {warnings?.length ? <Tag tone="gold">Review</Tag> : null}
          </div>
          {subtitle && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 1 }}>{subtitle}</div>}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)", padding: 2 }}>
          {expanded ? <ChevronUp size={16} strokeWidth={1.9} /> : <ChevronDown size={16} strokeWidth={1.9} />}
        </button>
      </div>
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-300)" }} onClick={(e) => e.stopPropagation()}>
          {children}
          <WarningList warnings={warnings} />
        </div>
      )}
    </div>
  );
}

// ── Personal Info section ─────────────────────────────────────────────────────

const PERSONAL_FIELDS: { key: keyof ParsedPersonal; label: string; hint?: string }[] = [
  { key: "full_name",     label: "Full name"       },
  { key: "phone",         label: "Phone number"    },
  { key: "location",      label: "Location"        },
  { key: "linkedin_url",  label: "LinkedIn URL"    },
  { key: "github_url",    label: "GitHub URL"      },
  { key: "portfolio_url", label: "Portfolio URL"   },
  { key: "summary",       label: "Professional summary", hint: "Applied as your career goal" },
];

const legacyPersonalFromV2 = (data: ParsedResumeData): ParsedPersonal => ({
  ...(data.personal ?? {}),
  ...(data.personalInfo?.fullName?.value ? { full_name: data.personalInfo.fullName.value } : {}),
  ...(data.personalInfo?.email?.value ? { email: data.personalInfo.email.value } : {}),
  ...(data.personalInfo?.phone?.value ? { phone: data.personalInfo.phone.value } : {}),
  ...(data.personalInfo?.location?.value ? { location: data.personalInfo.location.value } : {}),
  ...(data.personalInfo?.linkedinUrl?.value ? { linkedin_url: data.personalInfo.linkedinUrl.value } : {}),
  ...(data.personalInfo?.githubUrl?.value ? { github_url: data.personalInfo.githubUrl.value } : {}),
  ...(data.personalInfo?.portfolioUrl?.value ? { portfolio_url: data.personalInfo.portfolioUrl.value } : {}),
  ...(data.personalInfo?.professionalSummary?.value ? { summary: data.personalInfo.professionalSummary.value } : {}),
});

const personalFieldMeta = (data: ParsedResumeData, key: keyof ParsedPersonal): ParsedField<string> | undefined => {
  const map: Record<keyof ParsedPersonal, keyof ParsedPersonalInfo> = {
    full_name: "fullName",
    email: "email",
    phone: "phone",
    location: "location",
    linkedin_url: "linkedinUrl",
    github_url: "githubUrl",
    portfolio_url: "portfolioUrl",
    summary: "professionalSummary",
  };
  return data.personalInfo?.[map[key]];
};

function PersonalSection({ personal, parsedData, selFields, onToggleField, onEditField, applying, applyError, onApplyPersonal }: {
  personal: ParsedPersonal;
  parsedData: ParsedResumeData;
  selFields: Set<keyof ParsedPersonal>;
  onToggleField: (k: keyof ParsedPersonal) => void;
  onEditField: (k: keyof ParsedPersonal, v: string) => void;
  applying: boolean;
  applyError: string | null;
  onApplyPersonal: () => void;
}) {
  const hasAny = PERSONAL_FIELDS.some(({ key }) => !!personal[key]);
  if (!hasAny) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-400)" }}>
        No personal information found in this resume.
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", marginTop: 0, marginBottom: 18, lineHeight: 1.5 }}>
        Select fields to apply to your profile. These update your account settings, not your portfolio items.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PERSONAL_FIELDS.map(({ key, label, hint }) => {
          const value = personal[key];
          if (!value) return null;
          const sel = selFields.has(key);
          return (
            <div key={key} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: `1.5px solid ${sel ? "var(--ink-400)" : "var(--line-300)"}`,
              background: sel ? "var(--ink-100)" : "var(--paper-50)",
              cursor: "pointer", transition: "border-color 0.12s, background 0.12s",
            }} onClick={() => onToggleField(key)}>
              <span style={{ ...S.checkBox(sel), marginTop: 2, flexShrink: 0 }}>
                {sel && <Check size={12} strokeWidth={2.5} />}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, color: "var(--slate-500)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
                  {label}{hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}> · {hint}</span>}
                  <span style={{ marginLeft: 8 }}><ConfidenceBadge score={personalFieldMeta(parsedData, key)?.confidence} /></span>
                </div>
                {key === "summary" ? (
                  <textarea
                    rows={3}
                    value={value}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onEditField(key, e.target.value)}
                    style={{
                      width: "100%", fontFamily: "var(--font-body)", fontSize: 13.5,
                      color: "var(--ink-900)", background: "transparent", border: "none",
                      resize: "vertical", outline: "none", lineHeight: 1.5,
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onEditField(key, e.target.value)}
                    style={{
                      width: "100%", fontFamily: "var(--font-body)", fontSize: 13.5,
                      color: "var(--ink-900)", background: "transparent", border: "none",
                      outline: "none",
                    }}
                  />
                )}
                <WarningList warnings={personalFieldMeta(parsedData, key)?.warnings} />
              </div>
            </div>
          );
        })}
      </div>

      {applyError && (
        <div style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger-600)", background: "var(--danger-100)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
          {applyError}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={applying || selFields.size === 0}
          onClick={onApplyPersonal}
          iconLeft={applying ? <Loader2 size={14} strokeWidth={1.9} style={{ animation: "sig-spin 1s linear infinite" }} /> : <User size={14} strokeWidth={1.9} />}
        >
          {applying ? "Saving…" : `Apply ${selFields.size || ""} field${selFields.size !== 1 ? "s" : ""} to profile`}
        </Button>
      </div>
    </div>
  );
}

// ── Experience section ────────────────────────────────────────────────────────

function ExperienceSection({ items, selected, onToggle, onChange }: {
  items: ParsedExperienceItem[]; selected: Set<number>;
  onToggle: (i: number) => void; onChange: (i: number, p: Partial<ParsedExperienceItem>) => void;
}) {
  if (!items.length) return <Empty label="experience" />;
  return (
    <div>
      {items.map((exp, i) => (
        <CollapsibleItem key={i} title={exp.title}
          subtitle={[exp.company_name, exp.is_current ? "Present" : formatYear(exp.end_date)].filter(Boolean).join(" · ")}
          confidence={exp._meta?.confidence}
          warnings={exp._meta?.warnings}
          selected={selected.has(i)} onToggleSelect={() => onToggle(i)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="Job title" value={exp.title} onChange={(e) => onChange(i, { title: e.target.value })} />
              <Input label="Company" value={exp.company_name ?? ""} onChange={(e) => onChange(i, { company_name: e.target.value })} />
              <Input label="Start year" placeholder="2022" value={formatYear(exp.start_date)} onChange={(e) => onChange(i, { start_date: e.target.value ? `${e.target.value}-01-01` : undefined })} />
              <Input label="End year" placeholder="2024 or blank if current" value={formatYear(exp.end_date)} onChange={(e) => onChange(i, { end_date: e.target.value ? `${e.target.value}-12-31` : undefined })} />
            </div>
            <Input label="Location (optional)" value={exp.location ?? ""} onChange={(e) => onChange(i, { location: e.target.value })} />
            <Textarea label="Description" rows={3} value={exp.description ?? ""} onChange={(e) => onChange(i, { description: e.target.value })} />
            {(exp.tech_stack?.length ?? 0) > 0 && (
              <div><div style={S.label}>Technologies</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {exp.tech_stack!.map((t) => <Tag key={t} tone="blue">{t}</Tag>)}
                </div>
              </div>
            )}
          </div>
        </CollapsibleItem>
      ))}
    </div>
  );
}

// ── Education section ─────────────────────────────────────────────────────────

function EducationSection({ items, selected, onToggle, onChange }: {
  items: ParsedEducationItem[]; selected: Set<number>;
  onToggle: (i: number) => void; onChange: (i: number, p: Partial<ParsedEducationItem>) => void;
}) {
  if (!items.length) return <Empty label="education" />;
  return (
    <div>
      {items.map((edu, i) => (
        <CollapsibleItem key={i} title={edu.title}
          subtitle={[edu.institution_name, formatYear(edu.end_date)].filter(Boolean).join(" · ")}
          confidence={edu._meta?.confidence}
          warnings={edu._meta?.warnings}
          selected={selected.has(i)} onToggleSelect={() => onToggle(i)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Input label="Degree" value={edu.degree ?? ""} onChange={(e) => onChange(i, { degree: e.target.value })} />
              <Input label="Field of study" value={edu.field_of_study ?? ""} onChange={(e) => onChange(i, { field_of_study: e.target.value })} />
              <Input label="Institution" value={edu.institution_name ?? ""} onChange={(e) => onChange(i, { institution_name: e.target.value })} />
              <Input label="GPA (optional)" value={edu.gpa ?? ""} onChange={(e) => onChange(i, { gpa: e.target.value })} />
              <Input label="Start year" placeholder="2020" value={formatYear(edu.start_date)} onChange={(e) => onChange(i, { start_date: e.target.value ? `${e.target.value}-01-01` : undefined })} />
              <Input label="End year / Expected" placeholder="2024" value={formatYear(edu.end_date)} onChange={(e) => onChange(i, { end_date: e.target.value ? `${e.target.value}-06-30` : undefined })} />
            </div>
          </div>
        </CollapsibleItem>
      ))}
    </div>
  );
}

// ── Skills section ────────────────────────────────────────────────────────────

function SkillsSection({ items, selected, onToggle, onSelectAll, onDeselectAll }: {
  items: ParsedSkillItem[]; selected: Set<number>;
  onToggle: (i: number) => void; onSelectAll: () => void; onDeselectAll: () => void;
}) {
  if (!items.length) return <Empty label="skills" />;
  const allSel = selected.size === items.length;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button type="button" onClick={allSel ? onDeselectAll : onSelectAll}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-600)", fontWeight: 600 }}>
          {allSel ? "Deselect all" : "Select all"}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((skill, i) => {
          const sel = selected.has(i);
          return (
            <button key={i} type="button" onClick={() => onToggle(i)} style={{
              padding: "6px 14px", fontFamily: "var(--font-body)", fontSize: 13,
              fontWeight: sel ? 700 : 500, borderRadius: "var(--radius-full)",
              border: `1.5px solid ${sel ? "var(--ink-600)" : "var(--line-300)"}`,
              background: sel ? "var(--ink-100)" : "var(--paper-50)",
              color: sel ? "var(--ink-700)" : "var(--slate-700)", cursor: "pointer",
              transition: "border-color 0.1s, background 0.1s",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {sel && <Check size={11} strokeWidth={2.5} />}
              {skill.title}
              {skill._meta?.warnings?.length ? " · review" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Projects section ──────────────────────────────────────────────────────────

function ProjectsSection({ items, selected, onToggle, onChange }: {
  items: ParsedProjectItem[]; selected: Set<number>;
  onToggle: (i: number) => void; onChange: (i: number, p: Partial<ParsedProjectItem>) => void;
}) {
  if (!items.length) return <Empty label="projects" />;
  return (
    <div>
      {items.map((proj, i) => (
        <CollapsibleItem key={i} title={proj.title}
          subtitle={[proj.tech_stack?.slice(0, 4).join(", "), proj.description?.slice(0, 90)].filter(Boolean).join(" · ")}
          confidence={proj._meta?.confidence}
          warnings={proj._meta?.warnings}
          selected={selected.has(i)} onToggleSelect={() => onToggle(i)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input label="Project title" value={proj.title} onChange={(e) => onChange(i, { title: e.target.value })} />
            <Input label="URL (GitHub or live)" value={proj.project_url ?? ""} onChange={(e) => onChange(i, { project_url: e.target.value })} />
            <Input label="GitHub URL" value={proj.github_url ?? ""} onChange={(e) => onChange(i, { github_url: e.target.value })} />
            <Input label="Live demo URL" value={proj.live_url ?? ""} onChange={(e) => onChange(i, { live_url: e.target.value })} />
            <Textarea label="Description" rows={3} value={proj.description ?? ""} onChange={(e) => onChange(i, { description: e.target.value })} />
            {(proj.links?.length ?? 0) > 0 && (
              <div><div style={S.label}>Extracted links</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {proj.links!.map((link) => (
                    <a key={`${link.normalizedUrl}-${link.displayText ?? ""}`} href={link.normalizedUrl} target="_blank" rel="noreferrer"
                      style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-600)", overflowWrap: "anywhere" }}>
                      {link.displayText ? `${link.displayText}: ` : ""}{link.normalizedUrl}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(proj.tech_stack?.length ?? 0) > 0 && (
              <div><div style={S.label}>Technologies</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {proj.tech_stack!.map((t) => <Tag key={t} tone="blue">{t}</Tag>)}
                </div>
              </div>
            )}
          </div>
        </CollapsibleItem>
      ))}
    </div>
  );
}

// ── Research Papers section ──────────────────────────────────────────────────

function ResearchPapersSection({ items, selected, onToggle, onChange }: {
  items: ParsedResearchPaperItem[]; selected: Set<number>;
  onToggle: (i: number) => void; onChange: (i: number, p: Partial<ParsedResearchPaperItem>) => void;
}) {
  if (!items.length) return <Empty label="research papers" />;
  return (
    <div>
      {items.map((paper, i) => {
        const links = [
          paper.doi ? { label: "DOI", url: paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}` } : null,
          paper.arxivUrl ? { label: "arXiv", url: paper.arxivUrl } : null,
          paper.publicationUrl ? { label: "Publication", url: paper.publicationUrl } : null,
          paper.githubUrl ? { label: "Code", url: paper.githubUrl } : null,
          ...(paper.links ?? []).map((link) => ({
            label: link.displayText || link.kind || "Link",
            url: link.normalizedUrl || link.url,
          })),
        ]
          .filter(Boolean)
          .filter((link, index, all): link is { label: string; url: string } =>
            Boolean(link?.url) && all.findIndex((item) => item?.url === link?.url) === index,
          );
        return (
          <CollapsibleItem key={i} title={paper.title}
            subtitle={[paper.venue, paper.year, paper.publicationType !== "unknown" ? paper.publicationType : undefined].filter(Boolean).join(" · ")}
            confidence={paper._meta?.confidence}
            warnings={paper._meta?.warnings}
            selected={selected.has(i)} onToggleSelect={() => onToggle(i)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="Paper title" value={paper.title} onChange={(e) => onChange(i, { title: e.target.value })} />
              <Input label="Authors" value={paper.authors?.join(", ") ?? ""} onChange={(e) => onChange(i, { authors: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Venue" value={paper.venue ?? ""} onChange={(e) => onChange(i, { venue: e.target.value })} />
                <Input label="Year" value={paper.year ?? ""} onChange={(e) => onChange(i, { year: e.target.value })} />
              </div>
              <Input label="DOI" value={paper.doi ?? ""} onChange={(e) => onChange(i, { doi: e.target.value })} />
              <Input label="arXiv URL" value={paper.arxivUrl ?? ""} onChange={(e) => onChange(i, { arxivUrl: e.target.value })} />
              <Input label="Publication URL" value={paper.publicationUrl ?? ""} onChange={(e) => onChange(i, { publicationUrl: e.target.value })} />
              <Input label="GitHub / code URL" value={paper.githubUrl ?? ""} onChange={(e) => onChange(i, { githubUrl: e.target.value })} />
              <Textarea label="Abstract / description" rows={3} value={paper.abstract ?? ""} onChange={(e) => onChange(i, { abstract: e.target.value })} />
              {links.length > 0 && (
                <div><div style={S.label}>Extracted links</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {links.map((link) => (
                      <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer"
                        style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-600)", overflowWrap: "anywhere" }}>
                        {link.label}: {link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleItem>
        );
      })}
    </div>
  );
}

// ── Certifications section ────────────────────────────────────────────────────

function CertificationsSection({ items, selected, onToggle }: {
  items: ParsedCertificationItem[]; selected: Set<number>; onToggle: (i: number) => void;
}) {
  if (!items.length) return <Empty label="certifications" />;
  return (
    <div>
      {items.map((cert, i) => (
        <CollapsibleItem key={i} title={cert.title}
          subtitle={[cert.issuing_org, formatYear(cert.start_date)].filter(Boolean).join(" · ")}
          confidence={cert._meta?.confidence}
          warnings={cert._meta?.warnings}
          selected={selected.has(i)} onToggleSelect={() => onToggle(i)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Certification" value={cert.title} readOnly />
            <Input label="Issuing org" value={cert.issuing_org ?? ""} readOnly />
          </div>
        </CollapsibleItem>
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-400)" }}>
      No {label} found in this resume.
    </div>
  );
}

const initSelected = (arr?: Array<{ _meta?: ParsedItemMeta }>) =>
  new Set((arr ?? []).flatMap((item, i) => {
    const confidence = item._meta?.confidence;
    const needsReview = (item._meta?.warnings?.length ?? 0) > 0 || (confidence !== undefined && confidence < 0.6);
    return needsReview ? [] : [i];
  }));

// ── Main modal ────────────────────────────────────────────────────────────────

export function ResumeReviewModal({ docId, filename, parsedData, onClose, onApplied }: ResumeReviewModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  // Personal info state
  const [personal, setPersonal] = useState<ParsedPersonal>(() => legacyPersonalFromV2(parsedData));
  const [selPersonal, setSelPersonal] = useState<Set<keyof ParsedPersonal>>(() => {
    const s = new Set<keyof ParsedPersonal>();
    const keys: (keyof ParsedPersonal)[] = ["full_name","phone","location","linkedin_url","github_url","portfolio_url","summary"];
    const initialPersonal = legacyPersonalFromV2(parsedData);
    keys.forEach((k) => { if (initialPersonal[k]) s.add(k); });
    return s;
  });
  const [applyingPersonal, setApplyingPersonal] = useState(false);
  const [personalApplyError, setPersonalApplyError] = useState<string | null>(null);
  const [personalApplied, setPersonalApplied] = useState(false);

  // Portfolio item states
  const [experience, setExperience] = useState<ParsedExperienceItem[]>(parsedData.experience ?? []);
  const [selExp, setSelExp] = useState(() => initSelected(parsedData.experience));

  const [education, setEducation] = useState<ParsedEducationItem[]>(parsedData.education ?? []);
  const [selEdu, setSelEdu] = useState(() => initSelected(parsedData.education));

  const [skills, setSkills] = useState<ParsedSkillItem[]>(parsedData.skills ?? []);
  const [selSkills, setSelSkills] = useState(() => initSelected(parsedData.skills));

  const [projects, setProjects] = useState<ParsedProjectItem[]>(parsedData.projects ?? []);
  const [selProj, setSelProj] = useState(() => initSelected(parsedData.projects));

  const [researchPapers, setResearchPapers] = useState<ParsedResearchPaperItem[]>(parsedData.researchPapers ?? []);
  const [selResearch, setSelResearch] = useState(() => initSelected(parsedData.researchPapers));

  const [certifications] = useState<ParsedCertificationItem[]>(parsedData.certifications ?? []);
  const [selCert, setSelCert] = useState(() => initSelected(parsedData.certifications));

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const toggleSet = <T,>(set: Set<T>, setFn: (s: Set<T>) => void, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v); else next.add(v);
    setFn(next);
  };

  const totalPortfolioSelected = selExp.size + selEdu.size + selSkills.size + selProj.size + selResearch.size + selCert.size;

  const tabBadge = (tab: TabId): number => {
    if (tab === "personal") return selPersonal.size;
    if (tab === "experience") return selExp.size;
    if (tab === "education") return selEdu.size;
    if (tab === "skills") return selSkills.size;
    if (tab === "projects") return selProj.size;
    if (tab === "researchPapers") return selResearch.size;
    if (tab === "certifications") return selCert.size;
    return 0;
  };

  // Apply personal info through the resume-import apply endpoint.
  const handleApplyPersonal = async () => {
    setApplyingPersonal(true);
    setPersonalApplyError(null);
    try {
      const selectedPersonal: ParsedPersonal = {};
      for (const key of selPersonal) {
        const value = personal[key];
        if (value) selectedPersonal[key] = value;
      }
      await api.post(EP.resumeImportApply(docId), {
        personal: selectedPersonal,
        mergeStrategy: "skip_duplicates",
      });
      setPersonalApplied(true);
      setSelPersonal(new Set());
    } catch (err) {
      setPersonalApplyError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setApplyingPersonal(false);
    }
  };

  // Apply portfolio items to /resume-import/:id/apply
  const handleApplyPortfolio = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      const body = {
        experience: experience.filter((_, i) => selExp.has(i)),
        education: education.filter((_, i) => selEdu.has(i)),
        skills: skills.filter((_, i) => selSkills.has(i)),
        projects: projects.filter((_, i) => selProj.has(i)),
        researchPapers: researchPapers.filter((_, i) => selResearch.has(i)),
        certifications: certifications.filter((_, i) => selCert.has(i)),
        mergeStrategy: "skip_duplicates",
      };
      await api.post(EP.resumeImportApply(docId), body);
      onApplied();
      onClose();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply resume data");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 700, background: "var(--paper-50)", borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
        maxHeight: "92vh", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid var(--line-300)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 4 }}>
                Review imported details
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>
                We found the following in your resume
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", margin: "4px 0 0" }}>
                {filename} · {parsedData.confidence ? `${Math.round(parsedData.confidence.overall * 100)}% overall confidence · ` : ""}Select items and expand to edit before saving.
              </p>
              {(parsedData.warnings?.filter((w) => w.severity === "warning" || w.severity === "error").length ?? 0) > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {parsedData.warnings!
                    .filter((w) => w.severity === "warning" || w.severity === "error")
                    .slice(0, 3)
                    .map((warning) => (
                      <div key={`${warning.code}-${warning.field ?? ""}`} style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: warning.severity === "error" ? "var(--danger-600)" : "var(--brass-700)" }}>
                        {warning.message}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)", padding: 4, flexShrink: 0 }}>
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const count = tabBadge(tab.id);
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
                  padding: "9px 14px", fontFamily: "var(--font-body)", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink-900)" : "var(--slate-500)",
                  background: "transparent", border: "none",
                  borderBottom: active ? "2.5px solid var(--ink-600)" : "2.5px solid transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "color 0.12s", whiteSpace: "nowrap",
                }}>
                  {tab.label}
                  {(count > 0 || tab.id === "personal") && (
                    <span style={{
                      padding: "1px 7px", borderRadius: "var(--radius-full)",
                      background: active ? "var(--ink-200)" : "var(--paper-300)",
                      fontSize: 11, fontWeight: 700, color: "var(--ink-700)",
                    }}>
                      {tab.id === "personal" && personalApplied ? "✓" : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {activeTab === "personal" && (
            personalApplied ? (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--success-600)" }}>Profile updated successfully</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", marginTop: 4 }}>Head to Settings to review your updated profile details.</div>
              </div>
            ) : (
              <PersonalSection
                personal={personal}
                parsedData={parsedData}
                selFields={selPersonal}
                onToggleField={(k) => toggleSet(selPersonal, setSelPersonal, k)}
                onEditField={(k, v) => setPersonal((prev) => ({ ...prev, [k]: v }))}
                applying={applyingPersonal}
                applyError={personalApplyError}
                onApplyPersonal={handleApplyPersonal}
              />
            )
          )}
          {activeTab === "experience" && (
            <ExperienceSection items={experience} selected={selExp}
              onToggle={(i) => toggleSet(selExp, setSelExp, i)}
              onChange={(i, p) => setExperience((prev) => prev.map((e, idx) => idx === i ? { ...e, ...p } : e))} />
          )}
          {activeTab === "education" && (
            <EducationSection items={education} selected={selEdu}
              onToggle={(i) => toggleSet(selEdu, setSelEdu, i)}
              onChange={(i, p) => setEducation((prev) => prev.map((e, idx) => idx === i ? { ...e, ...p } : e))} />
          )}
          {activeTab === "skills" && (
            <SkillsSection items={skills} selected={selSkills}
              onToggle={(i) => toggleSet(selSkills, setSelSkills, i)}
              onSelectAll={() => setSelSkills(new Set(skills.map((_, i) => i)))}
              onDeselectAll={() => setSelSkills(new Set())} />
          )}
          {activeTab === "projects" && (
            <ProjectsSection items={projects} selected={selProj}
              onToggle={(i) => toggleSet(selProj, setSelProj, i)}
              onChange={(i, p) => setProjects((prev) => prev.map((e, idx) => idx === i ? { ...e, ...p } : e))} />
          )}
          {activeTab === "researchPapers" && (
            <ResearchPapersSection items={researchPapers} selected={selResearch}
              onToggle={(i) => toggleSet(selResearch, setSelResearch, i)}
              onChange={(i, p) => setResearchPapers((prev) => prev.map((e, idx) => idx === i ? { ...e, ...p } : e))} />
          )}
          {activeTab === "certifications" && (
            <CertificationsSection items={certifications} selected={selCert}
              onToggle={(i) => toggleSet(selCert, setSelCert, i)} />
          )}
        </div>

        {/* Footer — only shown for portfolio sections */}
        {activeTab !== "personal" && (
          <div style={{
            padding: "16px 28px", borderTop: "1px solid var(--line-300)",
            background: "var(--paper-100)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            {applyError
              ? <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--danger-600)", flex: 1 }}>{applyError}</div>
              : <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)" }}>
                  {totalPortfolioSelected} item{totalPortfolioSelected !== 1 ? "s" : ""} selected to add to portfolio
                </div>
            }
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <Button variant="ghost" onClick={onClose} disabled={applying}>Discard</Button>
              <Button variant="primary" onClick={handleApplyPortfolio}
                disabled={applying || totalPortfolioSelected === 0}
                iconLeft={applying ? <Loader2 size={15} strokeWidth={1.9} style={{ animation: "sig-spin 1s linear infinite" }} /> : undefined}>
                {applying ? "Applying…" : `Apply ${totalPortfolioSelected} item${totalPortfolioSelected !== 1 ? "s" : ""} to portfolio`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
