import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Copy, Stamp, Check, AlertTriangle, Lightbulb, Sparkle,
  Download, Link, X, Phone, Linkedin, Github, Globe, MapPin, Mail,
  Pencil, Save, Plus, Trash2, LayoutTemplate,
} from "lucide-react";
import { Tabs } from "@/components/navigation/Tabs";
import { Button } from "@/components/core/Button";
import { Badge } from "@/components/data-display/Badge";
import { Tag } from "@/components/data-display/Tag";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Input } from "@/components/forms/Input";
import { Seal } from "@/components/brand/Seal";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { User } from "@/store/auth";

function normalizeSkills(raw: unknown): Record<string, string[]> | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const names = raw.map((s: unknown) => {
      if (typeof s === "string") return s;
      if (s && typeof s === "object") {
        const o = s as Record<string, unknown>;
        return String(o.name ?? o.skill_name ?? o.title ?? "");
      }
      return "";
    }).filter(Boolean);
    return names.length ? { Skills: names } : undefined;
  }
  if (typeof raw === "object") return raw as Record<string, string[]>;
  return undefined;
}

interface GeneratedContent {
  summary?: string;
  experience?: Array<{ company?: string; role?: string; period?: string; bullets?: string[] }>;
  projects?: Array<{ name?: string; description?: string; tech_stack?: string[]; bullets?: string[] }>;
  skills?: Record<string, string[]>;
  education?: Array<{ institution?: string; degree?: string; period?: string; gpa?: string }>;
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
  ats_feedback?: { score?: number; foundKeywords?: string[]; missingKeywords?: string[]; suggestions?: string[] };
  generated_content?: GeneratedContent;
  pdf_signed_url?: string;
}

interface AtsResult {
  resumeVersionId: string;
  versionLabel: string | null;
  atsScore: number | null;
  atsFeedback: { score?: number; foundKeywords?: string[]; missingKeywords?: string[]; suggestions?: string[] } | null;
  jobTitle: string | null;
  companyName: string | null;
}

interface CoverLetterData { id: string; content: string }

function ScoreRing({ value }: { value: number }) {
  const r = 42, c = 2 * Math.PI * r, off = c * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--paper-300)" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke="var(--brass-500)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 55 55)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--slate-400)" }}>/ 100</span>
      </div>
    </div>
  );
}

function ResumePSection({ title, children, onAddItem }: { title: string; children: React.ReactNode; onAddItem?: () => void }) {
  return (
    <section className="resume-section" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ccc", paddingBottom: 3, marginBottom: 6 }}>
        <h2 style={{
          fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", margin: 0,
        }}>{title}</h2>
        {onAddItem && (
          <button onClick={onAddItem} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#888", display: "inline-flex", alignItems: "center", padding: 0 }}>
            <Plus size={9} strokeWidth={2} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ResumeContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 9, color: "#444" }}>
      {icon}{value}
    </span>
  );
}

function EditableSpan({
  value, onSave, editable, style, block,
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
      onBlur={editable && onSave ? (e) => onSave(e.currentTarget.textContent ?? "") : undefined}
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

function A4ResumePreview({
  content, resume, user, onContentChange, editable,
}: {
  content: GeneratedContent | undefined;
  resume: ResumeVersion;
  user: User | null;
  onContentChange?: (c: GeneratedContent) => void;
  editable: boolean;
}) {
  const jobTitle = resume.job_title || "";
  const companyName = resume.company_name || "";
  const normalizedSkills = normalizeSkills(content?.skills);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  const A4_W = 794;
  const A4_H = 1123;

  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) setScale(containerRef.current.offsetWidth / A4_W);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const updateField = (patch: Partial<GeneratedContent>) => {
    if (!content || !onContentChange) return;
    onContentChange({ ...content, ...patch });
  };

  const updateExp = (i: number, key: keyof NonNullable<GeneratedContent["experience"]>[number], val: string) => {
    const experience = (content?.experience ?? []).map((e, idx) => idx === i ? { ...e, [key]: val } : e);
    updateField({ experience });
  };
  const updateExpBullet = (i: number, j: number, val: string) => {
    const experience = (content?.experience ?? []).map((e, idx) => {
      if (idx !== i) return e;
      const bullets = (e.bullets ?? []).map((b, k) => k === j ? val : b);
      return { ...e, bullets };
    });
    updateField({ experience });
  };
  const addExpBullet = (i: number) => {
    const experience = (content?.experience ?? []).map((e, idx) => {
      if (idx !== i) return e;
      return { ...e, bullets: [...(e.bullets ?? []), "New bullet point"] };
    });
    updateField({ experience });
  };
  const removeExpBullet = (i: number, j: number) => {
    const experience = (content?.experience ?? []).map((e, idx) => {
      if (idx !== i) return e;
      return { ...e, bullets: (e.bullets ?? []).filter((_, k) => k !== j) };
    });
    updateField({ experience });
  };
  const addExperience = () => {
    updateField({ experience: [...(content?.experience ?? []), { role: "New Role", company: "Company", period: "2024 – Present", bullets: ["Describe your key achievement here"] }] });
  };
  const removeExperience = (i: number) => {
    updateField({ experience: (content?.experience ?? []).filter((_, idx) => idx !== i) });
  };

  const updateProj = (i: number, key: keyof NonNullable<GeneratedContent["projects"]>[number], val: string) => {
    const projects = (content?.projects ?? []).map((p, idx) => idx === i ? { ...p, [key]: val } : p);
    updateField({ projects });
  };
  const updateProjBullet = (i: number, j: number, val: string) => {
    const projects = (content?.projects ?? []).map((p, idx) => {
      if (idx !== i) return p;
      const bullets = (p.bullets ?? []).map((b, k) => k === j ? val : b);
      return { ...p, bullets };
    });
    updateField({ projects });
  };
  const removeProjBullet = (i: number, j: number) => {
    const projects = (content?.projects ?? []).map((p, idx) => {
      if (idx !== i) return p;
      return { ...p, bullets: (p.bullets ?? []).filter((_, k) => k !== j) };
    });
    updateField({ projects });
  };
  const updateProjTech = (i: number, valStr: string) => {
    const tech_stack = valStr.split("·").map((s) => s.trim()).filter(Boolean);
    updateField({ projects: (content?.projects ?? []).map((p, idx) => idx === i ? { ...p, tech_stack } : p) });
  };
  const addProject = () => {
    updateField({ projects: [...(content?.projects ?? []), { name: "New Project", description: "Brief project description", tech_stack: ["TypeScript"], bullets: ["Key achievement or feature"] }] });
  };
  const removeProject = (i: number) => {
    updateField({ projects: (content?.projects ?? []).filter((_, idx) => idx !== i) });
  };

  const updateSkillCat = (oldCat: string, newCat: string) => {
    if (!content?.skills) return;
    const updated: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(content.skills)) updated[k === oldCat ? newCat : k] = v;
    updateField({ skills: updated });
  };
  const updateSkillValues = (cat: string, valStr: string) => {
    const values = valStr.split(",").map((s) => s.trim()).filter(Boolean);
    updateField({ skills: { ...(content?.skills ?? {}), [cat]: values } });
  };
  const addSkillCategory = () => {
    const existing = content?.skills ?? {};
    const newKey = `Category ${Object.keys(existing).length + 1}`;
    updateField({ skills: { ...existing, [newKey]: ["skill"] } });
  };
  const removeSkillCategory = (cat: string) => {
    const updated: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(content?.skills ?? {})) { if (k !== cat) updated[k] = v; }
    updateField({ skills: updated });
  };

  const updateEdu = (i: number, key: keyof NonNullable<GeneratedContent["education"]>[number], val: string) => {
    const education = (content?.education ?? []).map((e, idx) => idx === i ? { ...e, [key]: val } : e);
    updateField({ education });
  };
  const addEducation = () => {
    updateField({ education: [...(content?.education ?? []), { degree: "Degree / Program", institution: "University Name", period: "2020 – 2024" }] });
  };
  const removeEducation = (i: number) => {
    updateField({ education: (content?.education ?? []).filter((_, idx) => idx !== i) });
  };

  const updateCert = (i: number, key: keyof NonNullable<GeneratedContent["certifications"]>[number], val: string) => {
    const certifications = (content?.certifications ?? []).map((c, idx) => idx === i ? { ...c, [key]: val } : c);
    updateField({ certifications });
  };
  const addCertification = () => {
    updateField({ certifications: [...(content?.certifications ?? []), { name: "Certification Name", issuer: "Issuing Organization", date: "2024" }] });
  };
  const removeCertification = (i: number) => {
    updateField({ certifications: (content?.certifications ?? []).filter((_, idx) => idx !== i) });
  };

  const deleteIconStyle: React.CSSProperties = {
    border: "none", background: "transparent", cursor: "pointer", color: "#aaa", padding: 0,
    display: "inline-flex", alignItems: "center", flexShrink: 0, lineHeight: 1,
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <div style={{ width: "100%", paddingBottom: `${(A4_H / A4_W) * 100}%`, position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: A4_W, height: A4_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}>
          <div
            className="resume-a4-page"
            style={{
              width: A4_W, height: A4_H,
              background: "#fff",
              padding: "48px 56px 44px",
              boxSizing: "border-box",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 10,
              color: "#1a1a1a",
              lineHeight: 1.45,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: 12, marginBottom: 16 }}>
              <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: "-0.3px", color: "#111" }}>
                {user?.full_name || "Your Name"}
              </h1>
              {jobTitle && (
                <div style={{ fontSize: 11, color: "#555", marginTop: 3, fontStyle: "italic" }}>
                  Tailored for {jobTitle}{companyName ? ` at ${companyName}` : ""}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8 }}>
                {user?.email && <ResumeContactRow icon={<Mail size={9} />} value={user.email} />}
                {user?.phone_number && <ResumeContactRow icon={<Phone size={9} />} value={user.phone_number} />}
                {user?.location && <ResumeContactRow icon={<MapPin size={9} />} value={user.location} />}
                {user?.linkedin_url && <ResumeContactRow icon={<Linkedin size={9} />} value={user.linkedin_url.replace(/^https?:\/\//, "")} />}
                {user?.github_url && <ResumeContactRow icon={<Github size={9} />} value={user.github_url.replace(/^https?:\/\//, "")} />}
                {user?.portfolio_url && <ResumeContactRow icon={<Globe size={9} />} value={user.portfolio_url.replace(/^https?:\/\//, "")} />}
              </div>
            </div>

            {content?.summary !== undefined && (
              <ResumePSection title="Summary">
                <p
                  contentEditable={editable || undefined}
                  suppressContentEditableWarning
                  onBlur={editable ? (e) => updateField({ summary: e.currentTarget.textContent ?? "" }) : undefined}
                  style={{ fontSize: 10, lineHeight: 1.5, color: "#333", margin: 0, outline: "none" }}
                >
                  {content.summary}
                </p>
              </ResumePSection>
            )}

            {(content?.experience !== undefined) && (
              <ResumePSection title="Experience" onAddItem={editable ? addExperience : undefined}>
                {(content.experience ?? []).map((e, i) => (
                  <div key={i} style={{ marginBottom: 10, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700, fontSize: 10.5, color: "#111", display: "flex", alignItems: "baseline", gap: 0 }}>
                        <EditableSpan value={e.role ?? ""} editable={editable} onSave={(v) => updateExp(i, "role", v)} />
                        {e.company && (<> · <EditableSpan value={e.company} editable={editable} onSave={(v) => updateExp(i, "company", v)} /></>)}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <EditableSpan value={e.period ?? ""} editable={editable} onSave={(v) => updateExp(i, "period", v)} style={{ fontSize: 9, color: "#777", fontStyle: "italic" }} />
                        {editable && <button style={deleteIconStyle} onClick={() => removeExperience(i)}><X size={8} strokeWidth={2} /></button>}
                      </div>
                    </div>
                    {e.bullets && e.bullets.length > 0 && (
                      <ul style={{ margin: "4px 0 0", paddingLeft: 14 }}>
                        {e.bullets.map((b, j) => (
                          <li key={j} style={{ fontSize: 9.5, lineHeight: 1.45, color: "#333", marginBottom: 2, display: "flex", alignItems: "flex-start", gap: 4 }}>
                            <EditableSpan value={b} editable={editable} onSave={(v) => updateExpBullet(i, j, v)} style={{ flex: 1 }} />
                            {editable && <button style={{ ...deleteIconStyle, marginTop: 1 }} onClick={() => removeExpBullet(i, j)}><X size={7} strokeWidth={2} /></button>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {editable && (
                      <button onClick={() => addExpBullet(i)} style={{ ...deleteIconStyle, color: "#bbb", fontSize: 8, marginTop: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        <Plus size={7} strokeWidth={2} /> bullet
                      </button>
                    )}
                  </div>
                ))}
              </ResumePSection>
            )}

            {(content?.projects !== undefined) && (
              <ResumePSection title="Projects" onAddItem={editable ? addProject : undefined}>
                {(content.projects ?? []).map((p, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <EditableSpan value={p.name ?? ""} editable={editable} onSave={(v) => updateProj(i, "name", v)} style={{ fontWeight: 700, fontSize: 10.5, color: "#111" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {p.tech_stack && p.tech_stack.length > 0 && (
                          <EditableSpan value={p.tech_stack.join(" · ")} editable={editable} onSave={(v) => updateProjTech(i, v)} style={{ fontSize: 9, color: "#777" }} />
                        )}
                        {editable && <button style={deleteIconStyle} onClick={() => removeProject(i)}><X size={8} strokeWidth={2} /></button>}
                      </div>
                    </div>
                    {p.description && <EditableSpan value={p.description} editable={editable} onSave={(v) => updateProj(i, "description", v)} block style={{ fontSize: 9.5, color: "#555", margin: "2px 0 2px", outline: "none" }} />}
                    {p.bullets && p.bullets.length > 0 && (
                      <ul style={{ margin: "2px 0 0", paddingLeft: 14 }}>
                        {p.bullets.map((b, j) => (
                          <li key={j} style={{ fontSize: 9.5, lineHeight: 1.45, color: "#333", marginBottom: 2, display: "flex", alignItems: "flex-start", gap: 4 }}>
                            <EditableSpan value={b} editable={editable} onSave={(v) => updateProjBullet(i, j, v)} style={{ flex: 1 }} />
                            {editable && <button style={{ ...deleteIconStyle, marginTop: 1 }} onClick={() => removeProjBullet(i, j)}><X size={7} strokeWidth={2} /></button>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </ResumePSection>
            )}

            {normalizedSkills && Object.keys(normalizedSkills).length > 0 && (
              <ResumePSection title="Skills" onAddItem={editable ? addSkillCategory : undefined}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {Object.entries(normalizedSkills).map(([cat, skills]) => (
                    <div key={cat} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <EditableSpan value={cat} editable={editable} onSave={(v) => updateSkillCat(cat, v)} style={{ fontWeight: 700, fontSize: 9.5, color: "#444", minWidth: 80, paddingTop: 1 }} />
                      <EditableSpan value={skills.join(", ")} editable={editable} onSave={(v) => updateSkillValues(cat, v)} style={{ fontSize: 9.5, color: "#333", flex: 1 }} />
                      {editable && <button style={deleteIconStyle} onClick={() => removeSkillCategory(cat)}><X size={8} strokeWidth={2} /></button>}
                    </div>
                  ))}
                </div>
              </ResumePSection>
            )}

            {(content?.education !== undefined) && (
              <ResumePSection title="Education" onAddItem={editable ? addEducation : undefined}>
                {(content.education ?? []).map((e, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <EditableSpan value={e.degree ?? ""} editable={editable} onSave={(v) => updateEdu(i, "degree", v)} style={{ fontWeight: 700, fontSize: 10.5, color: "#111" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <EditableSpan value={e.period ?? ""} editable={editable} onSave={(v) => updateEdu(i, "period", v)} style={{ fontSize: 9, color: "#777", fontStyle: "italic" }} />
                        {editable && <button style={deleteIconStyle} onClick={() => removeEducation(i)}><X size={8} strokeWidth={2} /></button>}
                      </div>
                    </div>
                    <div style={{ fontSize: 9.5, color: "#555" }}>
                      <EditableSpan value={e.institution ?? ""} editable={editable} onSave={(v) => updateEdu(i, "institution", v)} />
                      {e.gpa && (<> — GPA: <EditableSpan value={e.gpa} editable={editable} onSave={(v) => updateEdu(i, "gpa", v)} /></>)}
                    </div>
                  </div>
                ))}
              </ResumePSection>
            )}

            {(content?.certifications !== undefined) && (
              <ResumePSection title="Certifications" onAddItem={editable ? addCertification : undefined}>
                {(content.certifications ?? []).map((c, i) => (
                  <div key={i} style={{ fontSize: 9.5, marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ flex: 1 }}>
                      <EditableSpan value={c.name ?? ""} editable={editable} onSave={(v) => updateCert(i, "name", v)} style={{ fontWeight: 600 }} />
                      {c.issuer && (<> — <EditableSpan value={c.issuer} editable={editable} onSave={(v) => updateCert(i, "issuer", v)} style={{ color: "#555" }} /></>)}
                      {c.date && (<> (<EditableSpan value={c.date} editable={editable} onSave={(v) => updateCert(i, "date", v)} style={{ color: "#777" }} />)</>)}
                    </div>
                    {editable && <button style={deleteIconStyle} onClick={() => removeCertification(i)}><X size={8} strokeWidth={2} /></button>}
                  </div>
                ))}
              </ResumePSection>
            )}

            {!content && (
              <div style={{ color: "#aaa", fontSize: 11, textAlign: "center", paddingTop: 80 }}>
                Resume content is being generated…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ onClose, pdfUrl }: { onClose: () => void; pdfUrl?: string }) {
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    if (!pdfUrl) return;
    navigator.clipboard.writeText(pdfUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "40px 40px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", insetInline: 0, top: 0, height: 5, background: "linear-gradient(90deg, var(--brass-400), var(--brass-600))" }} />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><Seal size={150} /></div>
        <Badge tone="success" dot>Signed</Badge>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, color: "var(--ink-900)", margin: "12px 0 6px", letterSpacing: "-0.01em" }}>Your resume is signed.</h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.55, color: "var(--slate-700)", margin: "0 auto 24px", maxWidth: 320 }}>
          Crafted around who you are — and ready for who you'll become. Export it as a pixel-perfect PDF.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {pdfUrl ? (
            <a href={pdfUrl} download target="_blank" rel="noreferrer">
              <Button variant="gold" iconLeft={<Download size={16} strokeWidth={1.9} />}>Download PDF</Button>
            </a>
          ) : (
            <Button variant="gold" iconLeft={<Download size={16} strokeWidth={1.9} />} disabled>PDF not available</Button>
          )}
          <Button variant="secondary" iconLeft={<Link size={16} strokeWidth={1.9} />} onClick={copyLink} disabled={!pdfUrl}>{copied ? "Copied!" : "Copy link"}</Button>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}

function Toast({ msg, type = "success" }: { msg: string; type?: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: type === "error" ? "var(--danger-600, #dc2626)" : "var(--ink-900)",
      color: "var(--paper-50)",
      fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500,
      padding: "12px 18px", borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "success" ? <Check size={15} strokeWidth={2} /> : <AlertTriangle size={15} strokeWidth={2} />}
      {msg}
    </div>
  );
}

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("resume");
  const [exporting, setExporting] = useState(false);
  const [exportPreparing, setExportPreparing] = useState(false);
  const [exportPdfUrl, setExportPdfUrl] = useState<string | undefined>(undefined);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverContent, setCoverContent] = useState<string | null>(null);
  const [coverTone, setCoverTone] = useState("balanced");
  const [coverWhyThis, setCoverWhyThis] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [editableContent, setEditableContent] = useState<GeneratedContent | undefined>(undefined);

  const { data: resumeData, loading: resumeLoading } = useApi<ResumeVersion>(id ? EP.resume(id) : "");
  const { data: atsData, loading: atsLoading } = useApi<AtsResult>(id ? EP.ats(id) : "");

  const resume = resumeData;
  const content = resume?.generated_content;

  useEffect(() => {
    if (content && editableContent === undefined) setEditableContent(content);
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayContent = editableContent ?? content;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const saveEdits = async () => {
    if (!id || !editableContent) return;
    setSaving(true);
    try {
      await api.patch(EP.resumeContent(id), { generated_content: editableContent });
      showToast("Changes saved successfully.");
      setEditMode(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const discardEdits = () => {
    setEditableContent(content);
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
      showToast(err instanceof Error ? err.message : "Export failed. Please try again.", "error");
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

  if (resumeLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--paper-300)", borderTopColor: "var(--brass-500)", animation: "sig-spin 1s linear infinite" }} />
        <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-500)" }}>Loading resume…</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--slate-500)" }}>Resume not found.</div>
        <Button variant="secondary" onClick={() => navigate("/resumes")}>Back to resumes</Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* sub-header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 16px", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate("/resumes")} style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--line-300)", background: "transparent", borderRadius: "var(--radius-sm)", color: "var(--slate-600)", cursor: "pointer" }}>
            <ArrowLeft size={17} strokeWidth={1.9} />
          </button>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1.1 }}>{resume.version_label}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
              {jobTitle}{companyName ? ` · ${companyName}` : ""} · {resume.template_id} · {resume.page_length}
            </div>
          </div>
          <Badge tone="neutral">{resume.status === "draft" ? "Draft" : resume.status}</Badge>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {editMode ? (
            <>
              <Button variant="ghost" size="sm" onClick={discardEdits}>Discard</Button>
              <Button variant="primary" size="sm" iconLeft={<Save size={14} strokeWidth={1.9} />} onClick={saveEdits} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" iconLeft={<Pencil size={14} strokeWidth={1.9} />} onClick={() => setEditMode(true)}>Quick edit</Button>
              <Button variant="secondary" size="sm" iconLeft={<LayoutTemplate size={14} strokeWidth={1.9} />} onClick={() => navigate(`/resumes/${id}/edit`)}>Open in editor</Button>
              <Button variant="secondary" size="sm" iconLeft={<Copy size={14} strokeWidth={1.9} />} onClick={duplicateResume} disabled={duplicating}>{duplicating ? "Duplicating…" : "Duplicate"}</Button>
              <Button variant="gold" size="sm" iconLeft={<Stamp size={15} strokeWidth={1.9} />} onClick={prepareExport} disabled={exportPreparing}>
                {exportPreparing ? "Preparing…" : "Sign & Export"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs items={[{ id: "resume", label: "Resume" }, { id: "cover", label: "Cover Letter" }]} value={tab} onChange={setTab} style={{ marginBottom: 0 }} />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, marginTop: 24 }}>
        {/* A4 paper preview */}
        <div>
          {tab === "resume" ? (
            <div style={{ background: "var(--paper-200)", borderRadius: "var(--radius-md)", padding: 24, boxShadow: "var(--shadow-sm)" }}>
              {displayContent && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontFamily: "var(--font-body)", fontSize: 12, color: editMode ? "var(--brass-700)" : "var(--slate-400)" }}>
                  <Pencil size={12} strokeWidth={1.9} />
                  {editMode ? "Edit mode active — click any text to edit, use + / × to add or remove items" : "Click Edit to modify this resume"}
                </div>
              )}
              <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 2 }}>
                <A4ResumePreview
                  content={displayContent}
                  resume={resume}
                  user={user}
                  onContentChange={editMode ? setEditableContent : undefined}
                  editable={editMode}
                />
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--white)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: "52px 56px", minHeight: 780, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.7, color: "var(--slate-700)" }}>
              {coverContent ? (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink-900)", marginBottom: 24 }}>Cover Letter</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{coverContent}</div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--slate-400)" }}>
                  Generate a cover letter using the panel →
                </div>
              )}
            </div>
          )}
        </div>

        {/* right panel */}
        <aside>
          {tab === "resume" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "var(--surface-raised)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--brass-200)", overflow: "hidden", position: "relative" }}>
                <span style={{ position: "absolute", insetInline: 0, top: 0, height: 4, background: "linear-gradient(90deg, var(--brass-400), var(--brass-600))" }} />
                <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 22 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {atsLoading ? (
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)" }}>Calculating…</div>
                    ) : (
                      <>
                        <ScoreRing value={Math.round(atsScore || 0)} />
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)" }}>ATS match score</div>
                      </>
                    )}
                  </div>

                  {foundKeywords.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                        <Check size={15} strokeWidth={1.9} color="var(--success-600)" />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Matched keywords</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {foundKeywords.map((k) => <Tag key={k} tone="blue">{k}</Tag>)}
                      </div>
                    </div>
                  )}

                  {missingKeywords.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                        <AlertTriangle size={15} strokeWidth={1.9} color="var(--danger-600)" />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Missing keywords</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {missingKeywords.map((k) => <Tag key={k} tone="neutral">{k}</Tag>)}
                      </div>
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                        <Lightbulb size={15} strokeWidth={1.9} color="var(--brass-700)" />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Suggestions</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {suggestions.map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, fontFamily: "var(--font-body)", fontSize: 12.5, lineHeight: 1.45, color: "var(--slate-700)" }}>
                            <Sparkle size={13} strokeWidth={1.9} color="var(--brass-600)" style={{ flexShrink: 0, marginTop: 1 }} />
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {foundKeywords.length === 0 && missingKeywords.length === 0 && suggestions.length === 0 && !atsLoading && (
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)", textAlign: "center" }}>
                      ATS analysis data will appear here after generation.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick add sections */}
              {editMode && (
                <div style={{ background: "var(--paper-100)", border: "1px solid var(--line-200)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-500)", marginBottom: 10 }}>
                    Add sections
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "Add experience", fn: () => setEditableContent((c) => c ? { ...c, experience: [...(c.experience ?? []), { role: "New Role", company: "Company", period: "2024 – Present", bullets: ["Describe your achievement"] }] } : c) },
                      { label: "Add project", fn: () => setEditableContent((c) => c ? { ...c, projects: [...(c.projects ?? []), { name: "New Project", description: "Brief description", tech_stack: ["TypeScript"], bullets: [] }] } : c) },
                      { label: "Add education", fn: () => setEditableContent((c) => c ? { ...c, education: [...(c.education ?? []), { degree: "Degree", institution: "Institution", period: "2020 – 2024" }] } : c) },
                      { label: "Add certification", fn: () => setEditableContent((c) => c ? { ...c, certifications: [...(c.certifications ?? []), { name: "Certification", issuer: "Issuer", date: "2024" }] } : c) },
                    ].map(({ label, fn }) => (
                      <button key={label} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: "transparent", border: "1px dashed var(--line-300)", borderRadius: "var(--radius-sm)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                        <Plus size={13} strokeWidth={1.9} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>Shape your letter</div>
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
              <Button variant="gold" block iconLeft={<Sparkle size={16} strokeWidth={1.9} />} disabled={coverLoading} onClick={generateCoverLetter}>
                {coverLoading ? "Generating…" : "Generate cover letter"}
              </Button>
            </div>
          )}
        </aside>
      </div>

      {exporting && <ExportModal onClose={() => setExporting(false)} pdfUrl={exportPdfUrl || resume?.pdf_signed_url} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
