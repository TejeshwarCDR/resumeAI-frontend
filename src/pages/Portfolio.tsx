import React, { useState, useRef } from "react";
import { Pencil, Trash2, WandSparkles, Plus, X, Upload, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Tabs } from "@/components/navigation/Tabs";
import { Button } from "@/components/core/Button";
import { Tag } from "@/components/data-display/Tag";
import { Badge } from "@/components/data-display/Badge";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Select } from "@/components/forms/Select";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";

const TABS = [
  { id: "experience",     label: "Experience" },
  { id: "projects",       label: "Projects" },
  { id: "education",      label: "Education" },
  { id: "skills",         label: "Skills" },
  { id: "certifications", label: "Certifications" },
];

type ItemType = "experience" | "project" | "education" | "skill" | "certification";

interface PortfolioItem {
  id: string;
  type: "project" | "experience" | "education" | "skill" | "certification";
  title: string;
  description?: string;
  company_name?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  tech_stack?: string[];
  degree?: string;
  institution_name?: string;
  skill_name?: string;
  issuing_org?: string;
  gpa?: string;
  cert_url?: string;
}

function formatPeriod(item: PortfolioItem) {
  if (item.start_date || item.end_date) {
    const start = item.start_date ? item.start_date.slice(0, 4) : "";
    const end = item.is_current ? "Present" : (item.end_date ? item.end_date.slice(0, 4) : "");
    return [start, end].filter(Boolean).join(" — ");
  }
  return "";
}

function ItemCard({ item, onDelete, onEdit, deleting }: { item: PortfolioItem; onDelete: (id: string, name: string) => void; onEdit: (item: PortfolioItem) => void; deleting?: boolean }) {
  const subtitle = item.company_name || item.institution_name || item.issuing_org || "";
  const period = formatPeriod(item);
  const meta = [subtitle, period].filter(Boolean).join(" · ");
  const tags = item.tech_stack ?? [];
  const displayName = item.title || item.skill_name || "item";

  return (
    <Card padding="18px 20px" interactive style={{ opacity: deleting ? 0.5 : 1, transition: "opacity 0.15s" }}>
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "var(--ink-700)" }}>◈</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>
              {item.title}{item.skill_name && item.skill_name !== item.title ? ` (${item.skill_name})` : ""}
            </span>
            {item.is_current && <Badge tone="success" dot>Current</Badge>}
          </div>
          {meta && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 2 }}>{meta}</div>}
          {item.gpa && <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>GPA: {item.gpa}</div>}
          {item.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", margin: "8px 0 0", lineHeight: 1.5 }}>{item.description}</p>
          )}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {tags.map((t) => <Tag key={t} tone="blue">{t}</Tag>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            disabled={deleting}
            style={{ border: "none", background: "transparent", cursor: deleting ? "default" : "pointer", color: "var(--slate-400)", height: 24, display: "flex", alignItems: "center" }}
            title="Edit"
          >
            <Pencil size={15} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(item.id, displayName); }}
            disabled={deleting}
            style={{ border: "none", background: "transparent", cursor: deleting ? "default" : "pointer", color: deleting ? "var(--slate-300)" : "var(--danger-400, #f87171)", height: 24, display: "flex", alignItems: "center" }}
            title="Delete"
          >
            <Trash2 size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function EditItemModal({ item, onClose, onSaved }: { item: PortfolioItem; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [company, setCompany] = useState(item.company_name || "");
  const [institution, setInstitution] = useState(item.institution_name || "");
  const [startYear, setStartYear] = useState(item.start_date ? item.start_date.slice(0, 4) : "");
  const [endYear, setEndYear] = useState(item.end_date ? item.end_date.slice(0, 4) : "");
  const [isCurrent, setIsCurrent] = useState(item.is_current || false);
  const [techInput, setTechInput] = useState("");
  const [tech, setTech] = useState<string[]>(item.tech_stack || []);
  const [gpa, setGpa] = useState(item.gpa || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTech = () => {
    if (techInput.trim() && !tech.includes(techInput.trim())) {
      setTech([...tech, techInput.trim()]);
      setTechInput("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { title: title.trim() };
      if (description) payload.description = description.trim();
      if (item.type === "experience") {
        payload.company_name = company.trim();
        payload.start_date = startYear ? `${startYear}-01-01` : null;
        payload.end_date = !isCurrent && endYear ? `${endYear}-12-31` : null;
        payload.is_current = isCurrent;
      }
      if (item.type === "education") {
        payload.institution_name = institution.trim();
        payload.start_date = startYear ? `${startYear}-01-01` : null;
        payload.end_date = !isCurrent && endYear ? `${endYear}-06-30` : null;
        payload.is_current = isCurrent;
        payload.gpa = gpa.trim() || null;
      }
      if (item.type === "project") {
        payload.tech_stack = tech;
        payload.start_date = startYear ? `${startYear}-01-01` : null;
        payload.end_date = !isCurrent && endYear ? `${endYear}-12-31` : null;
      }
      await api.patch(EP.portfolioItem(item.id), payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={20} strokeWidth={1.9} /></button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Edit {typeLabel}</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label="Description (optional)" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          {item.type === "experience" && (
            <>
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Start year" placeholder="2021" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
                {!isCurrent && <Input label="End year" placeholder="2023" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
                <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
                Currently working here
              </label>
            </>
          )}
          {item.type === "education" && (
            <>
              <Input label="Institution" value={institution} onChange={(e) => setInstitution(e.target.value)} />
              <Input label="GPA (optional)" value={gpa} onChange={(e) => setGpa(e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Start year" placeholder="2020" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
                {!isCurrent && <Input label="Graduation year" placeholder="2024" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
                <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
                Currently enrolled
              </label>
            </>
          )}
          {item.type === "project" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Start year (optional)" placeholder="2022" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
                <Input label="End year (optional)" placeholder="2023" value={endYear} onChange={(e) => setEndYear(e.target.value)} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 8 }}>Tech stack</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
                  {tech.map((t) => <Tag key={t} tone="blue" onRemove={() => setTech(tech.filter((x) => x !== t))}>{t}</Tag>)}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input placeholder="TypeScript, React…" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())} style={{ flex: 1 }} />
                  <Button type="button" variant="secondary" size="sm" onClick={addTech}>Add</Button>
                </div>
              </div>
            </>
          )}
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </form>
      </div>
    </div>
  );
}

function AddProjectModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [techInput, setTechInput] = useState("");
  const [tech, setTech] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTech = () => {
    if (techInput.trim() && !tech.includes(techInput.trim())) {
      setTech([...tech, techInput.trim()]);
      setTechInput("");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(EP.portfolio, {
        type: "project",
        source: "manual",
        title: title.trim(),
        description: desc.trim() || undefined,
        tech_stack: tech,
        project_url: url.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={20} strokeWidth={1.9} /></button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add project</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Project title" placeholder="Project name" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label="Description (optional)" rows={3} placeholder="What did you build and why?" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Input label="Project URL (optional)" placeholder="github.com/you/project" value={url} onChange={(e) => setUrl(e.target.value)} />
          <div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 8 }}>Tech stack</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
              {tech.map((t) => <Tag key={t} tone="blue" onRemove={() => setTech(tech.filter((x) => x !== t))}>{t}</Tag>)}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input placeholder="TypeScript, React, Python…" value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())} style={{ flex: 1 }} />
              <Button type="button" variant="secondary" size="sm" onClick={addTech}>Add</Button>
            </div>
          </div>
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Add project"}</Button>
        </form>
      </div>
    </div>
  );
}

function AddExperienceModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [desc, setDesc] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(EP.portfolio, {
        type: "experience",
        source: "manual",
        title: title.trim(),
        company_name: company.trim(),
        description: desc.trim() || undefined,
        start_date: startYear ? `${startYear}-01-01` : undefined,
        end_date: !isCurrent && endYear ? `${endYear}-12-31` : undefined,
        is_current: isCurrent,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add experience");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={20} strokeWidth={1.9} /></button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add work experience</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Job title" placeholder="Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Company" placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} required />
          <Textarea label="Description (optional)" rows={3} placeholder="What you built, led, or achieved…" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start year" placeholder="2021" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            {!isCurrent && <Input label="End year" placeholder="2023" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
            Currently working here
          </label>
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Add experience"}</Button>
        </form>
      </div>
    </div>
  );
}

function AddEducationModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [degree, setDegree] = useState("");
  const [major, setMajor] = useState("");
  const [institution, setInstitution] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [gpa, setGpa] = useState("");
  const [coursework, setCoursework] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!degree.trim() || !institution.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const title = major ? `${degree} in ${major}` : degree;
      await api.post(EP.portfolio, {
        type: "education",
        source: "manual",
        title: title.trim(),
        degree: degree.trim(),
        institution_name: institution.trim(),
        description: coursework.trim() ? `Relevant coursework: ${coursework.trim()}` : undefined,
        gpa: gpa.trim() || undefined,
        start_date: startYear ? `${startYear}-01-01` : undefined,
        end_date: !isCurrent && endYear ? `${endYear}-06-30` : undefined,
        is_current: isCurrent,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add education");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 500, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={20} strokeWidth={1.9} /></button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add education</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Degree" placeholder="Bachelor of Science, Master of Engineering…" value={degree} onChange={(e) => setDegree(e.target.value)} required />
          <Input label="Major / Field of study" placeholder="Computer Science, Data Engineering…" value={major} onChange={(e) => setMajor(e.target.value)} />
          <Input label="Institution" placeholder="University or college name" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Start year" placeholder="2020" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            {!isCurrent && <Input label="Graduation year" placeholder="2024" value={endYear} onChange={(e) => setEndYear(e.target.value)} />}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", cursor: "pointer" }}>
            <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} style={{ width: 16, height: 16 }} />
            Currently enrolled
          </label>
          <Input label="GPA / CGPA (optional)" placeholder="3.8 / 4.0" value={gpa} onChange={(e) => setGpa(e.target.value)} />
          <Textarea label="Relevant coursework (optional)" rows={2} placeholder="Algorithms, Machine Learning, Distributed Systems…" value={coursework} onChange={(e) => setCoursework(e.target.value)} />
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Add education"}</Button>
        </form>
      </div>
    </div>
  );
}

function AddCertModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(EP.portfolio, {
        type: "certification",
        source: "manual",
        title: name.trim(),
        issuing_org: org.trim() || undefined,
        cert_url: certUrl.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add certification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}><X size={20} strokeWidth={1.9} /></button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>Add certification</h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Certification name" placeholder="AWS Certified Solutions Architect" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Issuing organization" placeholder="Amazon Web Services, Coursera…" value={org} onChange={(e) => setOrg(e.target.value)} />
          <Input label="Certificate URL (optional)" placeholder="credly.com/badges/..." value={certUrl} onChange={(e) => setCertUrl(e.target.value)} />
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Add certification"}</Button>
        </form>
      </div>
    </div>
  );
}

function UploadBanner({ onUploaded }: { onUploaded: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ extractedItemCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post<{ extractedItemCount: number; extractedItems: unknown[] }>(
        EP.portfolioUpload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploadResult({ extractedItemCount: r.data.extractedItemCount });
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card variant="seal" padding="16px 20px" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {uploading ? (
          <Loader2 size={22} strokeWidth={1.9} color="var(--brass-600)" style={{ animation: "sig-spin 1s linear infinite", flexShrink: 0 }} />
        ) : (
          <WandSparkles size={22} strokeWidth={1.9} color="var(--brass-600)" style={{ flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          {uploadResult ? (
            <>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>
                Resume parsed — {uploadResult.extractedItemCount} items added
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                Review them in the tabs below and edit as needed.
              </div>
            </>
          ) : error ? (
            <>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--danger-600)" }}>Upload failed</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>{error}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>
                Drop in a resume and we'll do the typing
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                We extract experience, projects, skills and education from PDF or DOCX.
              </div>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="gold"
          size="sm"
          iconLeft={<Upload size={14} strokeWidth={1.9} />}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload resume"}
        </Button>
      </div>
    </Card>
  );
}

type ModalType = "project" | "experience" | "education" | "certification" | null;

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      background: type === "error" ? "var(--danger-600, #dc2626)" : "var(--ink-900)",
      color: "var(--paper-50)", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500,
      padding: "12px 18px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {msg}
    </div>
  );
}

export function PortfolioPage() {
  const [tab, setTab] = useState("experience");
  const [skillInput, setSkillInput] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: items, setData } = useApi<PortfolioItem[]>(EP.portfolio);
  const allItems = items ?? [];

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshItems = async () => {
    try {
      const r = await api.get<PortfolioItem[]>(EP.portfolio);
      setData(r.data);
    } catch {
      showToast("Failed to refresh portfolio.", "error");
    }
  };

  const byType = (type: string) => {
    const typeMap: Record<string, string[]> = {
      experience: ["experience"],
      projects: ["project"],
      education: ["education"],
      skills: ["skill"],
      certifications: ["certification"],
    };
    const types = typeMap[type] ?? [type];
    return allItems.filter((i) => types.includes(i.type));
  };

  const skillItems = byType("skills");
  const skillNames = skillItems.map((s) => s.skill_name || s.title);

  const deleteItem = async (id: string, itemName?: string) => {
    const label = itemName ? `"${itemName}"` : "this item";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(EP.portfolioItem(id));
      setData((allItems).filter((i) => i.id !== id));
      showToast("Item deleted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const addSkill = async () => {
    if (!skillInput.trim()) return;
    try {
      const r = await api.post<PortfolioItem>(EP.portfolio, {
        type: "skill",
        source: "manual",
        title: skillInput.trim(),
        skill_name: skillInput.trim(),
      });
      setData([...(items ?? []), r.data]);
      setSkillInput("");
    } catch {}
  };

  const getAddModal = () => {
    switch (tab) {
      case "projects": return "project";
      case "experience": return "experience";
      case "education": return "education";
      case "certifications": return "certification";
      default: return null;
    }
  };

  const renderItems = (typeTab: string) => {
    const list = byType(typeTab);
    const addLabel = typeTab === "projects" ? "Add project" : typeTab === "experience" ? "Add experience" : typeTab === "education" ? "Add education" : typeTab === "certifications" ? "Add certification" : "Add item";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.length === 0 && (
          <Card padding="32px">
            <EmptyState
              title={`No ${typeTab} yet`}
              body="Add items to your portfolio to power your AI resume generation."
            />
          </Card>
        )}
        {list.map((item) => (
          <ItemCard key={item.id} item={item} onDelete={deleteItem} onEdit={setEditingItem} deleting={deletingId === item.id} />
        ))}
        <button
          onClick={() => setActiveModal(getAddModal())}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={16} strokeWidth={1.9} /> {addLabel}
        </button>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader overline="Your portfolio" title="Everything you are">
        <Button variant="primary" iconLeft={<Plus size={16} strokeWidth={1.9} />} onClick={() => setActiveModal(getAddModal())}>Add item</Button>
      </PageHeader>

      <UploadBanner onUploaded={refreshItems} />

      <Tabs items={TABS} value={tab} onChange={setTab} style={{ marginBottom: 22 }} />

      {tab === "skills" ? (
        <Card padding="22px">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 16 }}>
            {skillNames.map((s) => {
              const item = skillItems.find((i) => (i.skill_name || i.title) === s);
              return (
                <Tag key={s} tone="blue" onRemove={item ? () => deleteItem(item.id, s) : undefined}>{s}</Tag>
              );
            })}
            {skillNames.length === 0 && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)" }}>No skills added yet.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              style={{ flex: 1 }}
            />
            <Button variant="secondary" onClick={addSkill}>Add</Button>
          </div>
        </Card>
      ) : (
        renderItems(tab)
      )}

      {activeModal === "project" && (
        <AddProjectModal onClose={() => setActiveModal(null)} onAdded={refreshItems} />
      )}
      {activeModal === "experience" && (
        <AddExperienceModal onClose={() => setActiveModal(null)} onAdded={refreshItems} />
      )}
      {activeModal === "education" && (
        <AddEducationModal onClose={() => setActiveModal(null)} onAdded={refreshItems} />
      )}
      {activeModal === "certification" && (
        <AddCertModal onClose={() => setActiveModal(null)} onAdded={refreshItems} />
      )}
      {editingItem && (
        <EditItemModal item={editingItem} onClose={() => setEditingItem(null)} onSaved={refreshItems} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
