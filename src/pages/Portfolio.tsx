import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Pencil,
  Trash2,
  WandSparkles,
  Plus,
  X,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  GitCompare,
  RotateCcw,
  FileText,
} from "lucide-react";
import {
  ResumeReviewModal,
  type ParsedResumeData,
} from "@/components/resume/ResumeReviewModal";
import { ResumeVersionCompare } from "@/components/resume/ResumeVersionCompare";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
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
import { usePolling } from "@/lib/hooks/usePolling";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";
import { isValidArxivUrl, isValidDoi, isValidUrl, isValidYear } from "@/lib/validation";

const TABS = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "researchPapers", label: "Research Papers" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
];

type ItemType =
  "experience" | "project" | "education" | "skill" | "certification" | "research_paper";

interface PortfolioItem {
  id: string;
  type: "project" | "experience" | "education" | "skill" | "certification" | "research_paper";
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
  project_url?: string;
  source?: string;
  validation_score?: string | number | null;
  embedding_status?: string | null;
  embedding_error?: string | null;
  extra?: {
    github_verified?: boolean;
    github_full_name?: string;
    authors?: string[];
    venue?: string | null;
    year?: string | null;
    date?: string | null;
    doi?: string | null;
    arxivUrl?: string | null;
    publicationUrl?: string | null;
    githubUrl?: string | null;
    keywords?: string[];
    status?: string | null;
    [key: string]: unknown;
  };
}

type ResearchPaperFormState = {
  title: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
  arxivUrl: string;
  publicationUrl: string;
  githubUrl: string;
  description: string;
  keywords: string;
  status: string;
};

const RESEARCH_STATUSES = ["published", "accepted", "submitted", "under_review", "preprint", "unknown"];

const labelForStatus = (status?: string | null) =>
  (status || "unknown").replace("_", " ").replace(/^\w/, (char) => char.toUpperCase());

const authorsText = (item: PortfolioItem): string =>
  Array.isArray(item.extra?.authors) ? item.extra.authors.filter(Boolean).join(", ") : "";

const researchLinks = (item: PortfolioItem) => {
  const doi = typeof item.extra?.doi === "string" ? item.extra.doi : "";
  const arxivUrl = typeof item.extra?.arxivUrl === "string" ? item.extra.arxivUrl : "";
  const publicationUrl = typeof item.extra?.publicationUrl === "string" ? item.extra.publicationUrl : "";
  const githubUrl = typeof item.extra?.githubUrl === "string" ? item.extra.githubUrl : "";
  const embeddedLinks = Array.isArray(item.extra?.links)
    ? item.extra.links.flatMap((link) => {
        if (!link || typeof link !== "object") return [];
        const record = link as Record<string, unknown>;
        const url = typeof record.normalizedUrl === "string"
          ? record.normalizedUrl
          : typeof record.url === "string"
            ? record.url
            : "";
        if (!url) return [];
        return [{
          label:
            (typeof record.displayText === "string" && record.displayText) ||
            (typeof record.kind === "string" && record.kind) ||
            "Link",
          url,
        }];
      })
    : [];
  return [
    doi ? { label: "DOI", url: doi.startsWith("http") ? doi : `https://doi.org/${doi}` } : null,
    arxivUrl ? { label: "arXiv", url: arxivUrl } : null,
    publicationUrl || item.project_url ? { label: "Publication", url: publicationUrl || item.project_url || "" } : null,
    githubUrl ? { label: "Code", url: githubUrl } : null,
    ...embeddedLinks,
  ]
    .filter(Boolean)
    .filter((link, index, all): link is { label: string; url: string } =>
      Boolean(link?.url) && all.findIndex((item) => item?.url === link?.url) === index,
    );
};

const researchFormFromItem = (item?: PortfolioItem): ResearchPaperFormState => ({
  title: item?.title ?? "",
  authors: item ? authorsText(item) : "",
  venue: typeof item?.extra?.venue === "string" ? item.extra.venue : "",
  year: typeof item?.extra?.year === "string" ? item.extra.year : item?.start_date?.slice(0, 4) ?? "",
  doi: typeof item?.extra?.doi === "string" ? item.extra.doi : "",
  arxivUrl: typeof item?.extra?.arxivUrl === "string" ? item.extra.arxivUrl : "",
  publicationUrl: typeof item?.extra?.publicationUrl === "string" ? item.extra.publicationUrl : item?.project_url ?? "",
  githubUrl: typeof item?.extra?.githubUrl === "string" ? item.extra.githubUrl : "",
  description: item?.description ?? "",
  keywords: Array.isArray(item?.extra?.keywords) ? item.extra.keywords.filter(Boolean).join(", ") : "",
  status: typeof item?.extra?.status === "string" ? item.extra.status : "unknown",
});

const validateResearchForm = (form: ResearchPaperFormState): string => {
  if (!form.title.trim()) return "Paper title is required.";
  if (!isValidYear(form.year)) return "Use a valid publication year.";
  if (!isValidDoi(form.doi)) return "Use a valid DOI, for example 10.1109/example.2025.1.";
  if (!isValidArxivUrl(form.arxivUrl)) return "Use a valid arXiv abs or PDF URL.";
  if (!isValidUrl(form.publicationUrl)) return "Use a valid publication URL.";
  if (!isValidUrl(form.githubUrl)) return "Use a valid GitHub/code URL.";
  if (form.githubUrl.trim() && !/github\.com/i.test(form.githubUrl)) return "GitHub/code URL must be a GitHub URL.";
  return "";
};

const researchPayloadFromForm = (form: ResearchPaperFormState) => {
  const authors = form.authors.split(",").map((author) => author.trim()).filter(Boolean);
  const keywords = form.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean);
  const doi = form.doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  const primaryUrl = form.publicationUrl.trim() || form.arxivUrl.trim() || (doi ? `https://doi.org/${doi}` : "");
  return {
    type: "research_paper",
    source: "manual",
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    project_url: primaryUrl || undefined,
    domain_category: "research",
    start_date: form.year.trim() ? `${form.year.trim()}-01-01` : undefined,
    extra: {
      authors,
      venue: form.venue.trim() || null,
      year: form.year.trim() || null,
      doi: doi || null,
      arxivUrl: form.arxivUrl.trim() || null,
      publicationUrl: form.publicationUrl.trim() || null,
      githubUrl: form.githubUrl.trim() || null,
      keywords,
      status: form.status || "unknown",
      source: "manual",
    },
  };
};

function formatPeriod(item: PortfolioItem) {
  if (item.start_date || item.end_date) {
    const start = item.start_date ? item.start_date.slice(0, 4) : "";
    const end = item.is_current
      ? "Present"
      : item.end_date
        ? item.end_date.slice(0, 4)
        : "";
    return [start, end].filter(Boolean).join(" — ");
  }
  return "";
}

function ItemCard({
  item,
  onDelete,
  onEdit,
  deleting,
}: {
  item: PortfolioItem;
  onDelete: (id: string, name: string) => void;
  onEdit: (item: PortfolioItem) => void;
  deleting?: boolean;
}) {
  const subtitle =
    item.company_name || item.institution_name || item.issuing_org || "";
  const period = formatPeriod(item);
  const meta = [subtitle, period].filter(Boolean).join(" · ");
  const tags = item.tech_stack ?? [];
  const displayName = item.title || item.skill_name || "item";
  const isResearchPaper = item.type === "research_paper";
  const paperAuthors = isResearchPaper ? authorsText(item) : "";
  const paperVenueYear = isResearchPaper
    ? [typeof item.extra?.venue === "string" ? item.extra.venue : "", typeof item.extra?.year === "string" ? item.extra.year : ""].filter(Boolean).join(" · ")
    : "";
  const paperLinks = isResearchPaper ? researchLinks(item) : [];
  const isGitHubVerified =
    item.source === "github" || item.extra?.github_verified === true;
  const qualityScore =
    item.validation_score !== null && item.validation_score !== undefined
      ? Math.round(Number(item.validation_score))
      : null;

  return (
    <Card
      className="sig-portfolio-card"
      padding="18px 20px"
      interactive
      style={{ opacity: deleting ? 0.5 : 1, transition: "opacity 0.15s" }}
    >
      <div className="sig-portfolio-card-row">
        <span
          className="sig-portfolio-card-icon"
          style={{
            width: 42,
            height: 42,
            borderRadius: "var(--radius-sm)",
            background: "var(--ink-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              color: "var(--ink-700)",
            }}
          >
            ◈
          </span>
        </span>
        <div className="sig-portfolio-card-content">
          <div className="sig-portfolio-card-heading">
            <span
              className="sig-portfolio-card-title"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--ink-900)",
              }}
            >
              {item.title}
              {item.skill_name && item.skill_name !== item.title
                ? ` (${item.skill_name})`
                : ""}
            </span>
          </div>
          <div className="sig-portfolio-card-badges">
            {item.is_current && (
              <Badge tone="success" dot>
                Current
              </Badge>
            )}
            {isGitHubVerified ? (
              <Badge tone="success" dot>
                GitHub Verified
              </Badge>
            ) : (
              item.source &&
              item.source !== "manual" && (
                <Badge tone="neutral">{item.source.replace("_", " ")}</Badge>
              )
            )}
            {qualityScore !== null && (
              <Badge tone="blue">Quality {qualityScore}</Badge>
            )}
            {item.embedding_status && item.embedding_status !== "completed" && (
              <Badge
                tone={item.embedding_status === "failed" ? "danger" : "neutral"}
              >
                {item.embedding_status}
              </Badge>
            )}
          </div>
          {meta && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--slate-500)",
                marginTop: 2,
              }}
            >
              {meta}
            </div>
          )}
          {isResearchPaper && paperAuthors && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--slate-500)",
                marginTop: 2,
              }}
            >
              {paperAuthors}
            </div>
          )}
          {isResearchPaper && paperVenueYear && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--slate-500)",
                marginTop: 2,
              }}
            >
              {paperVenueYear} · {labelForStatus(item.extra?.status)}
            </div>
          )}
          {item.gpa && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12.5,
                color: "var(--slate-500)",
              }}
            >
              GPA: {item.gpa}
            </div>
          )}
          {item.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13.5,
                color: "var(--slate-700)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {item.description}
            </p>
          )}
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginTop: 10,
              }}
            >
              {tags.map((t) => (
                <Tag key={t} tone="blue">
                  {t}
                </Tag>
              ))}
            </div>
          )}
          {paperLinks.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {paperLinks.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-600)" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="sig-portfolio-card-actions">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            disabled={deleting}
            style={{
              border: "none",
              background: "transparent",
              cursor: deleting ? "default" : "pointer",
              color: "var(--slate-400)",
              height: 24,
              display: "flex",
              alignItems: "center",
            }}
            title="Edit"
          >
            <Pencil size={15} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id, displayName);
            }}
            disabled={deleting}
            style={{
              border: "none",
              background: "transparent",
              cursor: deleting ? "default" : "pointer",
              color: deleting
                ? "var(--slate-300)"
                : "var(--danger-400, #f87171)",
              height: 24,
              display: "flex",
              alignItems: "center",
            }}
            title="Delete"
          >
            <Trash2 size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function LinkedInImportBanner({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    batch: { id: string };
    records: Array<{
      id: string;
      status: string;
      normalized_data: { title?: string; type?: string };
    }>;
  } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await api.post<typeof preview>(EP.linkedinUpload, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(response.data);
      setSelected(
        new Set(
          (response.data?.records ?? [])
            .filter((record) => record.status === "preview")
            .map((record) => record.id),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "LinkedIn import failed.");
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!preview || selected.size === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(EP.linkedinApply(preview.batch.id), {
        recordIds: Array.from(selected),
      });
      setPreview(null);
      setSelected(new Set());
      onImported();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not apply LinkedIn import.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="18px 20px" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14.5,
              fontWeight: 700,
              color: "var(--ink-900)",
            }}
          >
            Import LinkedIn data export
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12.5,
              color: "var(--slate-500)",
              marginTop: 2,
            }}
          >
            Upload your LinkedIn ZIP export. We preview entries before saving
            anything.
          </div>
        </div>
        <Button
          variant="secondary"
          iconLeft={<Upload size={15} strokeWidth={1.9} />}
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? "Working…" : "Upload ZIP"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {error && (
        <div
          style={{
            color: "var(--danger-600, #dc2626)",
            fontFamily: "var(--font-body)",
            fontSize: 13,
            marginTop: 10,
          }}
        >
          {error}
        </div>
      )}
      {preview && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid var(--line-200)",
            paddingTop: 14,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--slate-600)",
              marginBottom: 10,
            }}
          >
            {preview.records.length} records found. Duplicates are unchecked.
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 240,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {preview.records.map((record) => (
              <label
                key={record.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  color: "var(--ink-800)",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(record.id)}
                  disabled={record.status === "skipped_duplicate"}
                  onChange={(event) => {
                    const next = new Set(selected);
                    if (event.target.checked) next.add(record.id);
                    else next.delete(record.id);
                    setSelected(next);
                  }}
                />
                <span style={{ flex: 1 }}>
                  {record.normalized_data.title ?? "Untitled"}{" "}
                  <span style={{ color: "var(--slate-400)" }}>
                    · {record.normalized_data.type ?? record.status}
                  </span>
                </span>
                {record.status === "skipped_duplicate" && (
                  <Badge tone="neutral">duplicate</Badge>
                )}
              </label>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 14,
            }}
          >
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Cancel
            </Button>
            <Button
              disabled={loading || selected.size === 0}
              onClick={() => void apply()}
            >
              Import selected
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function EditItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || "");
  const [company, setCompany] = useState(item.company_name || "");
  const [institution, setInstitution] = useState(item.institution_name || "");
  const [startYear, setStartYear] = useState(
    item.start_date ? item.start_date.slice(0, 4) : "",
  );
  const [endYear, setEndYear] = useState(
    item.end_date ? item.end_date.slice(0, 4) : "",
  );
  const [isCurrent, setIsCurrent] = useState(item.is_current || false);
  const [techInput, setTechInput] = useState("");
  const [tech, setTech] = useState<string[]>(item.tech_stack || []);
  const [gpa, setGpa] = useState(item.gpa || "");
  const [researchForm, setResearchForm] = useState<ResearchPaperFormState>(() => researchFormFromItem(item));
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
      if (item.type === "research_paper") {
        const validationError = validateResearchForm(researchForm);
        if (validationError) throw new Error(validationError);
        await api.patch(EP.portfolioItem(item.id), {
          ...researchPayloadFromForm(researchForm),
          type: "research_paper",
        });
        onSaved();
        onClose();
        return;
      }
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
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
          width: 500,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink-900)",
            margin: "0 0 20px",
          }}
        >
          Edit {typeLabel}
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {item.type !== "research_paper" && (
            <>
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                label="Description (optional)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
          )}
          {item.type === "experience" && (
            <>
              <Input
                label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Input
                  label="Start year"
                  placeholder="2021"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                />
                {!isCurrent && (
                  <Input
                    label="End year"
                    placeholder="2023"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                  />
                )}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  color: "var(--slate-700)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Currently working here
              </label>
            </>
          )}
          {item.type === "education" && (
            <>
              <Input
                label="Institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
              <Input
                label="GPA (optional)"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Input
                  label="Start year"
                  placeholder="2020"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                />
                {!isCurrent && (
                  <Input
                    label="Graduation year"
                    placeholder="2024"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                  />
                )}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-body)",
                  fontSize: 13.5,
                  color: "var(--slate-700)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => setIsCurrent(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Currently enrolled
              </label>
            </>
          )}
          {item.type === "project" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Input
                  label="Start year (optional)"
                  placeholder="2022"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                />
                <Input
                  label="End year (optional)"
                  placeholder="2023"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--slate-700)",
                    marginBottom: 8,
                  }}
                >
                  Tech stack
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 7,
                    marginBottom: 8,
                  }}
                >
                  {tech.map((t) => (
                    <Tag
                      key={t}
                      tone="blue"
                      onRemove={() => setTech(tech.filter((x) => x !== t))}
                    >
                      {t}
                    </Tag>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Input
                    placeholder="TypeScript, React…"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTech())
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addTech}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}
          {item.type === "research_paper" && (
            <>
              <Input
                label="Paper title"
                value={researchForm.title}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <Input
                label="Authors"
                placeholder="Ada Lovelace, Grace Hopper"
                value={researchForm.authors}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, authors: e.target.value }))}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Venue"
                  placeholder="IEEE Conference, Journal name…"
                  value={researchForm.venue}
                  onChange={(e) => setResearchForm((prev) => ({ ...prev, venue: e.target.value }))}
                />
                <Input
                  label="Year"
                  placeholder="2026"
                  value={researchForm.year}
                  onChange={(e) => setResearchForm((prev) => ({ ...prev, year: e.target.value }))}
                />
              </div>
              <Input
                label="DOI"
                placeholder="10.xxxx/..."
                value={researchForm.doi}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, doi: e.target.value }))}
              />
              <Input
                label="arXiv URL"
                placeholder="https://arxiv.org/abs/2501.12345"
                value={researchForm.arxivUrl}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, arxivUrl: e.target.value }))}
              />
              <Input
                label="Publication URL"
                placeholder="Publisher or paper page"
                value={researchForm.publicationUrl}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, publicationUrl: e.target.value }))}
              />
              <Input
                label="GitHub / code URL"
                placeholder="github.com/you/paper-code"
                value={researchForm.githubUrl}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, githubUrl: e.target.value }))}
              />
              <Textarea
                label="Description / abstract"
                rows={3}
                value={researchForm.description}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <Input
                label="Keywords"
                placeholder="Machine Learning, Healthcare AI"
                value={researchForm.keywords}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, keywords: e.target.value }))}
              />
              <Select
                label="Status"
                options={RESEARCH_STATUSES}
                value={researchForm.status}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, status: e.target.value }))}
              />
            </>
          )}
          {error && (
            <div
              style={{
                color: "var(--danger-600)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddProjectModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
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
          width: 500,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          position: "relative",
        }}
      >
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink-900)",
            margin: "0 0 20px",
          }}
        >
          Add project
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Input
            label="Project title"
            placeholder="Project name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label="Description (optional)"
            rows={3}
            placeholder="What did you build and why?"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <Input
            label="Project URL (optional)"
            placeholder="github.com/you/project"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--slate-700)",
                marginBottom: 8,
              }}
            >
              Tech stack
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                marginBottom: 8,
              }}
            >
              {tech.map((t) => (
                <Tag
                  key={t}
                  tone="blue"
                  onRemove={() => setTech(tech.filter((x) => x !== t))}
                >
                  {t}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                placeholder="TypeScript, React, Python…"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTech())
                }
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addTech}
              >
                Add
              </Button>
            </div>
          </div>
          {error && (
            <div
              style={{
                color: "var(--danger-600)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Add project"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddResearchPaperModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<ResearchPaperFormState>(() => researchFormFromItem());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateResearchForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post(EP.portfolio, researchPayloadFromForm(form));
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add research paper");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, background: "var(--paper-50)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-lg)", padding: "32px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)", margin: "0 0 20px" }}>
          Add research paper
        </h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Paper title" placeholder="Paper title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
          <Input label="Authors" placeholder="Ada Lovelace, Grace Hopper" value={form.authors} onChange={(e) => setForm((prev) => ({ ...prev, authors: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Venue" placeholder="Conference or journal" value={form.venue} onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))} />
            <Input label="Year" placeholder="2026" value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))} />
          </div>
          <Input label="DOI" placeholder="10.xxxx/..." value={form.doi} onChange={(e) => setForm((prev) => ({ ...prev, doi: e.target.value }))} />
          <Input label="arXiv URL" placeholder="https://arxiv.org/abs/2501.12345" value={form.arxivUrl} onChange={(e) => setForm((prev) => ({ ...prev, arxivUrl: e.target.value }))} />
          <Input label="Publication URL" placeholder="Publisher or paper page" value={form.publicationUrl} onChange={(e) => setForm((prev) => ({ ...prev, publicationUrl: e.target.value }))} />
          <Input label="GitHub / code URL" placeholder="github.com/you/paper-code" value={form.githubUrl} onChange={(e) => setForm((prev) => ({ ...prev, githubUrl: e.target.value }))} />
          <Textarea label="Description / abstract" rows={3} placeholder="Short abstract or summary" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <Input label="Keywords" placeholder="Machine Learning, Healthcare AI" value={form.keywords} onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))} />
          <Select label="Status" options={RESEARCH_STATUSES} value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} />
          {error && <div style={{ color: "var(--danger-600)", fontFamily: "var(--font-body)", fontSize: 13 }}>{error}</div>}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Add research paper"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddExperienceModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
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
          width: 500,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          position: "relative",
        }}
      >
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink-900)",
            margin: "0 0 20px",
          }}
        >
          Add work experience
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Input
            label="Job title"
            placeholder="Software Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Company"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
          <Textarea
            label="Description (optional)"
            rows={3}
            placeholder="What you built, led, or achieved…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              label="Start year"
              placeholder="2021"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
            />
            {!isCurrent && (
              <Input
                label="End year"
                placeholder="2023"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            )}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              color: "var(--slate-700)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Currently working here
          </label>
          {error && (
            <div
              style={{
                color: "var(--danger-600)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Add experience"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddEducationModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
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
        description: coursework.trim()
          ? `Relevant coursework: ${coursework.trim()}`
          : undefined,
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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
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
          width: 500,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          position: "relative",
        }}
      >
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink-900)",
            margin: "0 0 20px",
          }}
        >
          Add education
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Input
            label="Degree"
            placeholder="Bachelor of Science, Master of Engineering…"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          />
          <Input
            label="Major / Field of study"
            placeholder="Computer Science, Data Engineering…"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />
          <Input
            label="Institution"
            placeholder="University or college name"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              label="Start year"
              placeholder="2020"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
            />
            {!isCurrent && (
              <Input
                label="Graduation year"
                placeholder="2024"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            )}
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              color: "var(--slate-700)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Currently enrolled
          </label>
          <Input
            label="GPA / CGPA (optional)"
            placeholder="3.8 / 4.0"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
          />
          <Textarea
            label="Relevant coursework (optional)"
            rows={2}
            placeholder="Algorithms, Machine Learning, Distributed Systems…"
            value={coursework}
            onChange={(e) => setCoursework(e.target.value)}
          />
          {error && (
            <div
              style={{
                color: "var(--danger-600)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Add education"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddCertModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
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
      setError(
        err instanceof Error ? err.message : "Failed to add certification",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
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
          width: 480,
          background: "var(--paper-50)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          padding: "32px",
          position: "relative",
        }}
      >
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
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink-900)",
            margin: "0 0 20px",
          }}
        >
          Add certification
        </h2>
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Input
            label="Certification name"
            placeholder="AWS Certified Solutions Architect"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Issuing organization"
            placeholder="Amazon Web Services, Coursera…"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
          <Input
            label="Certificate URL (optional)"
            placeholder="credly.com/badges/..."
            value={certUrl}
            onChange={(e) => setCertUrl(e.target.value)}
          />
          {error && (
            <div
              style={{
                color: "var(--danger-600)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Add certification"}
          </Button>
        </form>
      </div>
    </div>
  );
}

interface DocumentStatusResult {
  docId: string;
  status: "pending" | "processing" | "completed" | "failed";
  filename: string;
  parsedData?: ParsedResumeData;
  parsingError?: string;
  nearDuplicateWarning?: { existingDocId: string; message: string };
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | {
      status: "polling";
      docId: string;
      filename: string;
      nearDuplicateWarning?: { existingDocId: string; message: string };
    }
  | {
      status: "success";
      docId: string;
      filename: string;
      parsedData: ParsedResumeData;
    }
  | { status: "error"; message: string; code?: string };

function UploadBanner({
  onUploaded,
  onHistoryChange,
}: {
  onUploaded: () => void;
  onHistoryChange: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const pollEndpoint =
    state.status === "polling" ? EP.resumeImportStatus(state.docId) : null;
  const { data: pollData, done: pollDone } = usePolling<DocumentStatusResult>(
    pollEndpoint,
    2500,
    (d) => d.status === "completed" || d.status === "failed",
  );

  useEffect(() => {
    if (!pollDone || !pollData) return;
    if (pollData.status === "completed" && pollData.parsedData) {
      setState({
        status: "success",
        docId: pollData.docId,
        filename: pollData.filename,
        parsedData: pollData.parsedData,
      });
      setReviewOpen(true);
      onHistoryChange();
    } else {
      setState({
        status: "error",
        message:
          pollData.parsingError ?? "AI parsing failed. Please try again.",
      });
    }
  }, [pollDone, pollData]);

  const handleFile = useCallback(async (file: File) => {
    setState({ status: "uploading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await api.post<{
        docId: string;
        filename: string;
        status: string;
        parsedData?: ParsedResumeData;
        nearDuplicateWarning?: { existingDocId: string; message: string };
      }>(EP.resumeImportUpload, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (r.data.status === "completed" && r.data.parsedData) {
        setState({
          status: "success",
          docId: r.data.docId,
          filename: r.data.filename || file.name,
          parsedData: r.data.parsedData,
        });
        setReviewOpen(true);
        onHistoryChange();
      } else {
        setState({
          status: "polling",
          docId: r.data.docId,
          filename: r.data.filename || file.name,
          nearDuplicateWarning: r.data.nearDuplicateWarning,
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      const code = (err as { code?: string }).code;
      setState({ status: "error", message: msg, code });
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isDuplicate =
    state.status === "error" &&
    (state.code === "DUPLICATE_FILE" || state.code === "DUPLICATE_CONTENT");
  const isPolling = state.status === "polling";
  const nearDupWarning = isPolling ? state.nearDuplicateWarning : undefined;

  return (
    <>
      <Card
        variant="seal"
        padding="16px 20px"
        style={{
          marginBottom: nearDupWarning ? 8 : 20,
          border: dragging ? "2px dashed var(--brass-500)" : undefined,
          transition: "border 0.15s",
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {state.status === "uploading" || isPolling ? (
            <Loader2
              size={22}
              strokeWidth={1.9}
              color="var(--brass-600)"
              style={{
                animation: "sig-spin 1s linear infinite",
                flexShrink: 0,
              }}
            />
          ) : state.status === "success" ? (
            <CheckCircle2
              size={22}
              strokeWidth={1.9}
              color="var(--success-600)"
              style={{ flexShrink: 0 }}
            />
          ) : state.status === "error" ? (
            <AlertCircle
              size={22}
              strokeWidth={1.9}
              color={isDuplicate ? "var(--warning-600)" : "var(--danger-600)"}
              style={{ flexShrink: 0 }}
            />
          ) : (
            <WandSparkles
              size={22}
              strokeWidth={1.9}
              color="var(--brass-600)"
              style={{ flexShrink: 0 }}
            />
          )}

          <div style={{ flex: 1 }}>
            {state.status === "idle" && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink-900)",
                  }}
                >
                  Drop in a resume and we'll do the typing
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    color: "var(--slate-500)",
                  }}
                >
                  We extract experience, projects, skills and education from PDF
                  or DOCX.
                </div>
              </>
            )}
            {state.status === "uploading" && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink-900)",
                  }}
                >
                  Uploading…
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    color: "var(--slate-500)",
                  }}
                >
                  Storing your file securely.
                </div>
              </>
            )}
            {isPolling && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink-900)",
                  }}
                >
                  Parsing your resume…
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    color: "var(--slate-500)",
                  }}
                >
                  Our AI is reading {state.filename}. This usually takes 10–20
                  seconds.
                </div>
              </>
            )}
            {state.status === "success" && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink-900)",
                  }}
                >
                  Resume parsed successfully
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    color: "var(--slate-500)",
                  }}
                >
                  Review and select what to add to your portfolio.
                </div>
              </>
            )}
            {state.status === "error" && (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: isDuplicate
                      ? "var(--warning-600)"
                      : "var(--danger-600)",
                  }}
                >
                  {isDuplicate ? "Duplicate resume" : "Upload failed"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    color: "var(--slate-500)",
                  }}
                >
                  {state.message}
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {state.status === "success" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewOpen(true)}
              >
                Review & apply
              </Button>
            )}
            {!isDuplicate && !isPolling && (
              <Button
                variant="gold"
                size="sm"
                iconLeft={<Upload size={14} strokeWidth={1.9} />}
                disabled={state.status === "uploading"}
                onClick={() => {
                  setState({ status: "idle" });
                  fileInputRef.current?.click();
                }}
              >
                {state.status === "uploading"
                  ? "Uploading…"
                  : state.status === "error"
                    ? "Try again"
                    : "Upload resume"}
              </Button>
            )}
            {isDuplicate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setState({ status: "idle" });
                  fileInputRef.current?.click();
                }}
              >
                Upload a different file
              </Button>
            )}
          </div>
        </div>
      </Card>

      {nearDupWarning && (
        <div
          style={{
            marginBottom: 20,
            padding: "10px 16px",
            background: "var(--warning-100, #fef9c3)",
            border: "1px solid var(--warning-400, #facc15)",
            borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-body)",
            fontSize: 12.5,
            color: "var(--warning-800, #713f12)",
            lineHeight: 1.45,
          }}
        >
          <strong>Similar resume detected</strong> · {nearDupWarning.message}
        </div>
      )}

      {reviewOpen && state.status === "success" && (
        <ResumeReviewModal
          docId={state.docId}
          filename={state.filename}
          parsedData={state.parsedData}
          onClose={() => setReviewOpen(false)}
          onApplied={() => {
            onUploaded();
            setState({ status: "idle" });
          }}
        />
      )}
    </>
  );
}

interface ResumeHistoryItem {
  id: string;
  original_filename: string;
  parsing_status: string;
  file_size: number;
  created_at: string;
  parsed_data: ParsedResumeData | null;
}

function ResumeHistorySection({ refreshKey }: { refreshKey: number }) {
  const { data: docs, setData } = useApi<ResumeHistoryItem[]>(
    EP.resumeImportList,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [compareVersions, setCompareVersions] = useState<
    [ResumeHistoryItem, ResumeHistoryItem] | null
  >(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  // Re-fetch when parent signals a change
  useEffect(() => {
    if (refreshKey === 0) return;
    api
      .get<ResumeHistoryItem[]>(EP.resumeImportList)
      .then((r) => setData(r.data))
      .catch(() => {});
  }, [refreshKey]);

  const list = docs ?? [];
  if (!list.length) return null;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < 2) next.add(id);
        else {
          // Replace oldest selection
          const [first] = next;
          next.delete(first);
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectedArr = [...selected];
  const canCompare =
    selectedArr.length === 2 &&
    selectedArr.every((id) => list.find((d) => d.id === id)?.parsed_data);

  const startCompare = () => {
    if (!canCompare) return;
    const [a, b] = selectedArr.map((id) => list.find((d) => d.id === id)!);
    // Put older first
    const sorted = [a, b].sort(
      (x, y) =>
        new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
    );
    setCompareVersions(sorted as [ResumeHistoryItem, ResumeHistoryItem]);
  };

  const handleRetry = async (id: string) => {
    setRetrying(id);
    try {
      await api.post(EP.resumeImportRetry(id));
    } catch {}
    setRetrying(null);
  };

  const handleDelete = async (doc: ResumeHistoryItem) => {
    const confirmed = window.confirm(
      `Delete ${doc.original_filename} from resume history?`,
    );
    if (!confirmed) return;

    setDeletingDoc(doc.id);
    try {
      await api.delete(EP.resumeImportDelete(doc.id));
      setData((prev) => (prev ?? []).filter((item) => item.id !== doc.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
      setCompareVersions((prev) =>
        prev && prev.some((item) => item.id === doc.id) ? null : prev,
      );
    } catch {
    } finally {
      setDeletingDoc(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const statusBadge = (status: string) => {
    if (status === "completed")
      return (
        <Badge tone="success" dot>
          Parsed
        </Badge>
      );
    if (status === "failed") return <Badge tone="danger">Failed</Badge>;
    return (
      <Badge tone="warning" dot>
        Parsing…
      </Badge>
    );
  };

  return (
    <>
      <div
        style={{
          marginTop: 40,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={16} strokeWidth={1.9} color="var(--slate-500)" />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--slate-600)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Resume history
          </span>
        </div>
        {selectedArr.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<GitCompare size={14} strokeWidth={1.9} />}
            disabled={!canCompare}
            onClick={startCompare}
          >
            {canCompare
              ? "Compare selected"
              : `Select ${2 - selectedArr.length} more to compare`}
          </Button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((doc) => {
          const isSel = selected.has(doc.id);
          const canSel =
            doc.parsing_status === "completed" && !!doc.parsed_data;
          return (
            <Card
              key={doc.id}
              padding="14px 18px"
              style={{
                border: isSel
                  ? "1.5px solid var(--ink-500)"
                  : "1.5px solid var(--line-300)",
                background: isSel ? "var(--ink-100)" : "var(--paper-50)",
                transition: "border-color 0.12s, background 0.12s",
                cursor: canSel ? "pointer" : "default",
              }}
              onClick={() => canSel && toggleSelect(doc.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileText
                  size={18}
                  strokeWidth={1.7}
                  color={isSel ? "var(--ink-600)" : "var(--slate-400)"}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ink-900)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.original_filename}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--slate-500)",
                      marginTop: 2,
                    }}
                  >
                    {formatDate(doc.created_at)} · {formatSize(doc.file_size)}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  {statusBadge(doc.parsing_status)}
                  {doc.parsing_status === "failed" && (
                    <button
                      type="button"
                      title="Retry parsing"
                      disabled={retrying === doc.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(doc.id);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "var(--slate-400)",
                        padding: 2,
                      }}
                    >
                      <RotateCcw
                        size={15}
                        strokeWidth={1.9}
                        style={
                          retrying === doc.id
                            ? { animation: "sig-spin 1s linear infinite" }
                            : undefined
                        }
                      />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete from resume history"
                    disabled={deletingDoc === doc.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(doc);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: deletingDoc === doc.id ? "default" : "pointer",
                      color: "var(--slate-400)",
                      padding: 2,
                      opacity: deletingDoc === doc.id ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                  {canSel && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `1.5px solid ${isSel ? "var(--ink-600)" : "var(--line-300)"}`,
                        background: isSel
                          ? "var(--ink-600)"
                          : "var(--paper-50)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isSel && (
                        <CheckCircle2
                          size={11}
                          strokeWidth={2.5}
                          color="var(--paper-50)"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selected.size > 0 && !canCompare && (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--slate-400)",
            textAlign: "center",
          }}
        >
          Select up to 2 parsed resumes to compare their contents.
        </div>
      )}

      {compareVersions && (
        <ResumeVersionCompare
          versions={[
            {
              id: compareVersions[0].id,
              filename: compareVersions[0].original_filename,
              uploadedAt: compareVersions[0].created_at,
              parsedData: compareVersions[0].parsed_data!,
            },
            {
              id: compareVersions[1].id,
              filename: compareVersions[1].original_filename,
              uploadedAt: compareVersions[1].created_at,
              parsedData: compareVersions[1].parsed_data!,
            },
          ]}
          onClose={() => setCompareVersions(null)}
        />
      )}
    </>
  );
}

type ModalType =
  "project" | "research_paper" | "experience" | "education" | "certification" | null;

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
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
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

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
      researchPapers: ["research_paper"],
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
      setData(allItems.filter((i) => i.id !== id));
      showToast("Item deleted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const addSkill = async () => {
    const skillName = skillInput.trim();
    if (!skillName) return;
    const normalizedSkill = skillName.toLowerCase().replace(/\s+/g, " ");
    const duplicateSkill = skillNames.some(
      (name) =>
        name.trim().toLowerCase().replace(/\s+/g, " ") === normalizedSkill,
    );
    if (duplicateSkill) {
      showToast("This skill already exists in your portfolio.", "error");
      return;
    }
    try {
      const r = await api.post<PortfolioItem>(EP.portfolio, {
        type: "skill",
        source: "manual",
        title: skillName,
        skill_name: skillName,
      });
      setData([...(items ?? []), r.data]);
      setSkillInput("");
      showToast("Skill added.");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not add skill.",
        "error",
      );
    }
  };

  const getAddModal = () => {
    switch (tab) {
      case "projects":
        return "project";
      case "researchPapers":
        return "research_paper";
      case "experience":
        return "experience";
      case "education":
        return "education";
      case "certifications":
        return "certification";
      default:
        return null;
    }
  };

  const renderItems = (typeTab: string) => {
    const list = byType(typeTab);
    const addLabel =
      typeTab === "projects"
        ? "Add project"
        : typeTab === "researchPapers"
          ? "Add research paper"
        : typeTab === "experience"
          ? "Add experience"
          : typeTab === "education"
            ? "Add education"
            : typeTab === "certifications"
              ? "Add certification"
              : "Add item";

    return (
      <div className="sig-card-grid">
        {list.length === 0 && (
          <Card padding="32px" style={{ gridColumn: "1 / -1" }}>
            <EmptyState
              title={`No ${typeTab} yet`}
              body="Add items to your portfolio to power your AI resume generation."
            />
          </Card>
        )}
        {list.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onDelete={deleteItem}
            onEdit={setEditingItem}
            deleting={deletingId === item.id}
          />
        ))}
        <button
          onClick={() => setActiveModal(getAddModal())}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 72,
            padding: "12px",
            background: "transparent",
            border: "1.5px dashed var(--line-300)",
            borderRadius: "var(--radius-md)",
            color: "var(--ink-600)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} strokeWidth={1.9} /> {addLabel}
        </button>
      </div>
    );
  };

  const portfolioCounts = [
    ["Experience", byType("experience").length],
    ["Projects", byType("projects").length],
    ["Research Papers", byType("researchPapers").length],
    ["Education", byType("education").length],
    ["Skills", skillNames.length],
    ["Certifications", byType("certifications").length],
  ];
  const githubCount = allItems.filter(
    (item) => item.source === "github",
  ).length;

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="Your portfolio"
        title="Everything you are"
        subtitle="Manage the evidence Signuture uses to rank projects, identify gaps, and generate targeted resumes."
      >
        <Button
          variant="primary"
          iconLeft={<Plus size={16} strokeWidth={1.9} />}
          onClick={() => setActiveModal(getAddModal())}
        >
          Add item
        </Button>
      </PageHeader>

      <UploadBanner
        onUploaded={refreshItems}
        onHistoryChange={() => setHistoryRefreshKey((k) => k + 1)}
      />
      <LinkedInImportBanner onImported={refreshItems} />

      <Tabs
        items={TABS}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 22 }}
      />

      <div className="sig-page-with-rail">
        <section className="sig-main-column">
          {tab === "skills" ? (
            <Card padding="22px">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                  marginBottom: 16,
                }}
              >
                {skillNames.map((s) => {
                  const item = skillItems.find(
                    (i) => (i.skill_name || i.title) === s,
                  );
                  return (
                    <Tag
                      key={s}
                      tone="blue"
                      onRemove={item ? () => deleteItem(item.id, s) : undefined}
                    >
                      {s}
                    </Tag>
                  );
                })}
                {skillNames.length === 0 && (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: "var(--slate-400)",
                    }}
                  >
                    No skills added yet.
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                  style={{ flex: 1 }}
                />
                <Button variant="secondary" onClick={addSkill}>
                  Add
                </Button>
              </div>
            </Card>
          ) : (
            renderItems(tab)
          )}

          <ResumeHistorySection refreshKey={historyRefreshKey} />
        </section>

        <aside className="sig-rail">
          <Card variant="seal" padding="22px">
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--brass-700)",
                marginBottom: 12,
              }}
            >
              Portfolio health
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {portfolioCounts.map(([label, count]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--slate-500)" }}>{label}</span>
                  <span style={{ color: "var(--ink-900)", fontWeight: 700 }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card padding="20px">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ink-900)",
                marginBottom: 8,
              }}
            >
              Source mix
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--slate-600)",
                margin: "0 0 12px",
              }}
            >
              {githubCount > 0
                ? `${githubCount} item${githubCount === 1 ? "" : "s"} came from GitHub sync.`
                : "Connect GitHub to import repository-backed project evidence."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (window.location.href = "/github-sync")}
            >
              Manage GitHub sync
            </Button>
          </Card>
        </aside>
      </div>

      {activeModal === "project" && (
        <AddProjectModal
          onClose={() => setActiveModal(null)}
          onAdded={refreshItems}
        />
      )}
      {activeModal === "research_paper" && (
        <AddResearchPaperModal
          onClose={() => setActiveModal(null)}
          onAdded={refreshItems}
        />
      )}
      {activeModal === "experience" && (
        <AddExperienceModal
          onClose={() => setActiveModal(null)}
          onAdded={refreshItems}
        />
      )}
      {activeModal === "education" && (
        <AddEducationModal
          onClose={() => setActiveModal(null)}
          onAdded={refreshItems}
        />
      )}
      {activeModal === "certification" && (
        <AddCertModal
          onClose={() => setActiveModal(null)}
          onAdded={refreshItems}
        />
      )}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={refreshItems}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </PageContainer>
  );
}
