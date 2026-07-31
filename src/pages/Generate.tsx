import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Briefcase, Building2, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Card } from "@/components/data-display/Card";
import { Seal } from "@/components/brand/Seal";
import { Badge } from "@/components/data-display/Badge";
import { ReadinessChecklist } from "@/components/data-display/ReadinessChecklist";
import { Alert } from "@/components/feedback/Alert";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";
import { useApi } from "@/lib/hooks/useApi";
import { useAuth } from "@/store/auth";
import { readableList } from "@/lib/validation";
import {
  ResumeTemplateThumbnail,
  resumeTemplates,
  type ResumeTemplateId,
} from "@/lib/resumeTemplates";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
];

// These keys match the backend's current_stage values from the orchestrator
const GEN_STAGES = [
  { key: "analyzing_jd",       label: "Analyzing job description",  detail: "Extracting required skills, seniority and tech stack" },
  { key: "scoring_portfolio",  label: "Scoring your portfolio",     detail: "Ranking your experience against the role" },
  { key: "generating_content", label: "Crafting your resume",       detail: "Shaping each line in your voice" },
  { key: "rendering_pdf",      label: "Rendering the PDF",          detail: "Setting the page, ready to sign" },
  { key: "done",               label: "Signed and ready",           detail: "Your resume is complete" },
];

const STAGE_KEY_TO_IDX = Object.fromEntries(GEN_STAGES.map((s, i) => [s.key, i]));

interface GenerateResult {
  generationJobId: string;
  resumeVersion: { id: string; version_label: string; ats_score: string };
}

interface JobStatus {
  status: string;
  current_stage: string;
  progress_percent: number;
  error_message?: string | null;
}

interface PortfolioItem {
  id: string;
  type?: "project" | "experience" | "education" | "skill" | "certification" | "research_paper";
}

interface JobTarget {
  id: string;
  job_title: string;
  company_name: string;
  job_description: string;
  source_url?: string | null;
  source_platform?: string | null;
}

function StageChecklist({ stageKey, done }: { stageKey: string; done: boolean }) {
  const activeIdx = STAGE_KEY_TO_IDX[stageKey] ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 440 }}>
      {GEN_STAGES.map((s, i) => {
        const isCompleted = done ? true : i < activeIdx;
        const isActive = !done && i === activeIdx;
        const isPending = !done && i > activeIdx;

        return (
          <div
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: isPending ? 0.4 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <span style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: isCompleted ? "scale(1.05)" : "scale(1)" }}>
              {isCompleted ? (
                <CheckCircle2 size={22} strokeWidth={1.9} color="var(--brass-500)" />
              ) : isActive ? (
                <span style={{
                  display: "inline-flex", width: 22, height: 22, borderRadius: "50%",
                  border: "2.5px solid var(--brass-500)", borderTopColor: "transparent",
                  animation: "sig-spin 0.9s linear infinite",
                }} />
              ) : (
                <Circle size={22} strokeWidth={1.9} color="var(--line-300)" />
              )}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: 14, fontWeight: isActive ? 700 : 600,
                color: isActive ? "var(--ink-900)" : isCompleted ? "var(--ink-700)" : "var(--slate-400)",
              }}>
                {s.label}
              </div>
              {isActive && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 2 }}>
                  {s.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GenForm({ onDone }: { onDone: (resumeId: string) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: portfolioItems, loading: portfolioLoading, error: portfolioError } = useApi<PortfolioItem[]>(EP.portfolio);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [tpl, setTpl] = useState<ResumeTemplateId>("classic-professional");
  const [len, setLen] = useState("1-page");
  const [projectCount, setProjectCount] = useState(3);
  const [language, setLanguage] = useState("en");
  const [prefillJobTargetId, setPrefillJobTargetId] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stageKey, setStageKey] = useState("analyzing_jd");
  const [pct, setPct] = useState(0);
  const [doneResumeId, setDoneResumeId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jobTargetId = params.get("jobTargetId");
    if (!jobTargetId) return;

    setPrefillLoading(true);
    api.get<JobTarget>(EP.jobTarget(jobTargetId))
      .then((response) => {
        setPrefillJobTargetId(response.data.id);
        setJobTitle(response.data.job_title);
        setCompany(response.data.company_name);
        setJd(response.data.job_description);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load imported job target.");
      })
      .finally(() => setPrefillLoading(false));
  }, [location.search]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (fallbackRef.current) { clearInterval(fallbackRef.current); fallbackRef.current = null; }
  };

  // Smooth fallback animation between polls so the bar looks alive
  const startFallbackAnimation = useCallback((startPct: number) => {
    if (fallbackRef.current) clearInterval(fallbackRef.current);
    fallbackRef.current = setInterval(() => {
      setPct((p) => Math.min(p + 0.4, startPct + 18));
    }, 300);
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const r = await api.get<JobStatus>(EP.generateStatus(id));
      const job = r.data;
      if (job.progress_percent) setPct(job.progress_percent);
      if (job.current_stage) setStageKey(job.current_stage);
      if (fallbackRef.current) { clearInterval(fallbackRef.current); fallbackRef.current = null; }
      if (job.progress_percent) startFallbackAnimation(job.progress_percent);
    } catch {
      // polling can fail silently
    }
  }, [startFallbackAnimation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingReasons = readinessItems.filter((item) => !item.complete).map((item) => item.label);
    if (missingReasons.length > 0) {
      setError(`Before generating, complete: ${readableList(missingReasons)}.`);
      return;
    }
    if (portfolioLoading) {
      setError("Checking your portfolio. Please wait a moment.");
      return;
    }
    if (portfolioError) {
      setError(`Could not check your portfolio: ${portfolioError}`);
      return;
    }
    const availableProjects = (portfolioItems ?? []).filter((item) => item.type === "project").length;
    if (!portfolioItems?.length) {
      setError("Add at least one portfolio item before generating a resume.");
      return;
    }
    if (availableProjects === 0) {
      setError("Add or sync at least one project before generating a targeted resume.");
      return;
    }
    if (!Number.isInteger(projectCount) || projectCount < 1) {
      setError("Projects to include must be at least 1.");
      return;
    }
    if (!jobTitle.trim() || !company.trim() || !jd.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (jd.trim().length < 50) {
      setError("Job description must be at least 50 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    setGenerating(true);
    setPct(4);
    setStageKey("analyzing_jd");

    try {
      const r = await api.post<GenerateResult>(EP.generate, {
        jobTitle,
        companyName: company,
        jobDescription: jd,
        templateId: tpl,
        pageLength: len,
        outputLanguage: language,
        projectCount,
        ...(prefillJobTargetId ? { jobTargetId: prefillJobTargetId } : {}),
      });
      stopPolling();
      setPct(100);
      setStageKey("done");
      setDoneResumeId(r.data.resumeVersion.id);
      setJobId(r.data.generationJobId);
    } catch (err: unknown) {
      stopPolling();
      setGenerating(false);
      setLoading(false);
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    }
  };

  // Once we have a jobId (from a previous partial response), poll status
  useEffect(() => {
    if (!jobId || doneResumeId) return;
    pollRef.current = setInterval(() => pollStatus(jobId), 2500);
    return () => stopPolling();
  }, [jobId, doneResumeId, pollStatus]);

  useEffect(() => () => stopPolling(), []);

  const hasContact = !!user?.full_name?.trim() && (!!user?.email?.trim() || !!user?.phone_number?.trim());
  const availableProjectCount = (portfolioItems ?? []).filter((item) => item.type === "project").length;
  const effectiveProjectCount = Math.min(projectCount, availableProjectCount);
  const projectCountNotice = availableProjectCount > 0 && projectCount > availableProjectCount
    ? `You have ${availableProjectCount} project${availableProjectCount === 1 ? "" : "s"} available, so we’ll use all of them.`
    : "We’ll rank your projects and use the most relevant ones for this job.";
  const hasEvidence = (portfolioItems ?? []).some((item) => ["project", "experience", "education"].includes(item.type ?? "")) || (portfolioItems?.length ?? 0) > 0;
  const hasSkill = (portfolioItems ?? []).some((item) => item.type === "skill");
  const hasJobInputs = !!jobTitle.trim() && !!company.trim() && jd.trim().length >= 50;
  const readinessItems = [
    {
      label: "Name and contact information",
      complete: hasContact,
      action: !hasContact ? <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>Fix</Button> : undefined,
    },
    {
      label: "At least one project",
      complete: !portfolioLoading && availableProjectCount > 0,
      action: !portfolioLoading && availableProjectCount === 0 ? <Button variant="ghost" size="sm" onClick={() => navigate("/portfolio")}>Add</Button> : undefined,
    },
    {
      label: "At least one skill",
      complete: hasSkill,
      action: !hasSkill ? <Button variant="ghost" size="sm" onClick={() => navigate("/portfolio")}>Add</Button> : undefined,
    },
    {
      label: "Target role, company, and job description",
      complete: hasJobInputs,
    },
  ];
  const readyToGenerate = readinessItems.every((item) => item.complete) && !loading && !portfolioLoading && !portfolioError;

  if (generating && doneResumeId) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
        <div style={{ marginBottom: 28, animation: "sig-pulse 2s ease-in-out infinite" }}>
          <Seal size={180} />
        </div>
        <Badge tone="success" dot>Signed</Badge>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 40, color: "var(--ink-900)", margin: "16px 0 10px", letterSpacing: "-0.01em" }}>
          Your resume is signed.
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15.5, color: "var(--slate-600)", margin: "0 0 32px", maxWidth: 400, lineHeight: 1.6 }}>
          Crafted around who you are — and ready for who you'll become.
        </p>
        <Button variant="gold" size="lg" iconRight={<ArrowRight size={18} strokeWidth={1.9} />} onClick={() => onDone(doneResumeId)}>
          View your resume
        </Button>
      </div>
    );
  }

  if (generating) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ position: "relative", marginBottom: 40 }}>
          <Seal size={120} />
          <span style={{
            position: "absolute", inset: -12, borderRadius: "50%",
            border: "2px solid var(--brass-300)", borderTopColor: "var(--brass-600)",
            animation: "sig-spin 1.2s linear infinite", pointerEvents: "none",
          }} />
          <span style={{
            position: "absolute", inset: -22, borderRadius: "50%",
            border: "1px solid var(--brass-200)", borderBottomColor: "var(--brass-500)",
            animation: "sig-spin 2s linear infinite reverse", pointerEvents: "none",
          }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 32, color: "var(--ink-900)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          Crafting your resume…
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--slate-500)", margin: "0 0 36px" }}>
          This usually takes 30–60 seconds
        </p>

        {/* Progress bar */}
        <div style={{ width: 440, maxWidth: "100%", marginBottom: 32 }}>
          <div style={{ height: 6, background: "var(--paper-300)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: "linear-gradient(90deg, var(--brass-400), var(--brass-600))",
              borderRadius: "var(--radius-pill)",
              transition: "width 400ms ease-out",
            }} />
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--slate-400)", marginTop: 6, textAlign: "right" }}>
            {Math.round(pct)}%
          </div>
        </div>

        <StageChecklist stageKey={stageKey} done={false} />
      </div>
    );
  }

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="New resume"
        title="Who are you crafting for?"
        subtitle="Paste the target role once, then Signuture ranks your portfolio evidence and builds a focused resume."
      />

      {prefillLoading && (
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-600)", marginBottom: 14 }}>
          Loading imported job target…
        </div>
      )}

      <div className="sig-page-with-rail">
      <Card padding="28px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <Input
            label="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            leading={<Briefcase size={16} strokeWidth={1.9} />}
            placeholder="e.g. Software Engineer"
            required
          />
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            leading={<Building2 size={16} strokeWidth={1.9} />}
            placeholder="e.g. Acme Corp"
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)" }}>Output language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                height: 42,
                border: "1.5px solid var(--line-300)",
                borderRadius: "var(--radius-md)",
                padding: "0 12px",
                background: "var(--paper-50)",
                fontFamily: "var(--font-body)",
                color: "var(--ink-900)",
              }}
            >
              {LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div style={{ alignSelf: "end", fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", lineHeight: 1.5 }}>
            Names, URLs, technologies, metrics, and code identifiers are preserved.
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <Textarea
            label="Paste the job description"
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            hint="We analyze this to extract required skills, seniority and tech stack."
          />
        </div>

        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Choose Resume Template</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 22 }}>
          {resumeTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTpl(t.id)}
              style={{
                textAlign: "left", padding: "16px", cursor: "pointer",
                background: tpl === t.id ? "var(--brass-100)" : "var(--paper-50)",
                border: `1.5px solid ${tpl === t.id ? "var(--brass-500)" : "var(--line-300)"}`,
                borderRadius: "var(--radius-md)",
                boxShadow: tpl === t.id ? "var(--shadow-gold)" : "var(--shadow-xs)",
                transition: "all 0.15s ease",
              }}
              aria-pressed={tpl === t.id}
            >
              <ResumeTemplateThumbnail templateId={t.id} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", marginTop: 12 }}>{t.name}</span>
                {tpl === t.id && <CheckCircle2 size={17} strokeWidth={1.9} color="var(--brass-600)" />}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginTop: 4, lineHeight: 1.4 }}>{t.description}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <Badge tone="success">ATS-friendly</Badge>
                <Badge tone="neutral">{t.category}</Badge>
              </div>
            </button>
          ))}
        </div>

        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Page length</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
          {["1-page", "1.5-page"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLen(l)}
              style={{
                padding: "9px 18px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600,
                background: len === l ? "var(--ink-600)" : "transparent",
                color: len === l ? "var(--paper-50)" : "var(--slate-700)",
                border: `1.5px solid ${len === l ? "var(--ink-600)" : "var(--line-300)"}`,
                borderRadius: "var(--radius-pill)",
                transition: "all 0.15s ease",
              }}
            >{l}</button>
          ))}
        </div>

        <div style={{ marginBottom: 24, maxWidth: 360 }}>
          <Input
            label="Projects to include"
            type="number"
            min={1}
            max={Math.max(1, Math.min(8, availableProjectCount || 8))}
            value={projectCount}
            onChange={(e) => setProjectCount(Number(e.target.value))}
            hint={projectCountNotice}
          />
          {availableProjectCount > 0 && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginTop: 6 }}>
              {effectiveProjectCount} of {availableProjectCount} available project{availableProjectCount === 1 ? "" : "s"} will be considered for the resume.
            </div>
          )}
        </div>

        {error && (
          <Alert tone="danger" style={{ marginBottom: 16 }}>{error}</Alert>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--line-200)", paddingTop: 20 }}>
          <Button type="submit" variant="gold" size="lg" disabled={!readyToGenerate} iconLeft={<Sparkles size={18} strokeWidth={1.9} />}>
            {loading ? "Starting…" : "Craft my resume"}
          </Button>
        </div>
      </form>
      </Card>

      <aside className="sig-rail">
        <Card variant="seal" padding="22px">
          <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 10 }}>
            Generation readiness
          </div>
          <ReadinessChecklist items={readinessItems} />
        </Card>
        <Card padding="20px">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>
            Project selection
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.5, color: "var(--slate-600)", margin: "0 0 12px" }}>
            {projectCountNotice}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink-900)" }}>{effectiveProjectCount}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)" }}>Selected</div>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink-900)" }}>{availableProjectCount}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)" }}>Available</div>
            </div>
          </div>
        </Card>
      </aside>
      </div>
    </PageContainer>
  );
}

export function GeneratePage() {
  const navigate = useNavigate();
  return <GenForm onDone={(id) => navigate(`/resumes/${id}`)} />;
}
