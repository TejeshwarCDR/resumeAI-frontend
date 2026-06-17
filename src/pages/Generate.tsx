import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Briefcase, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { Seal } from "@/components/brand/Seal";
import { Badge } from "@/components/data-display/Badge";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";

const TEMPLATES = [
  { id: "modern",   name: "Modern",   note: "Clean, two-tone, recruiter-friendly" },
  { id: "academic", name: "Academic", note: "Dense, publication-ready" },
  { id: "minimal",  name: "Minimal",  note: "Quiet typography, lots of air" },
];

const GEN_STAGES = [
  { key: "analyzing_jd",      label: "Analyzing JD",     detail: "Extracting required skills, seniority and tech stack" },
  { key: "scoring_portfolio", label: "Scoring",          detail: "Ranking your portfolio against the role" },
  { key: "generating_content",label: "Generating",       detail: "Shaping each line in your voice" },
  { key: "rendering_pdf",     label: "Rendering",        detail: "Setting the page, ready to sign" },
  { key: "completed",         label: "Done",             detail: "Signed and ready" },
];

function GenForm({ onStart }: { onStart: (jobId: string) => void }) {
  const [jobTitle, setJobTitle] = useState("Staff Software Engineer");
  const [company, setCompany] = useState("Vela Systems");
  const [jd, setJd] = useState("We're hiring a Staff Software Engineer to lead our developer platform. You'll design distributed systems in Go, own our Kubernetes deployment story, and mentor a growing team. gRPC, observability and strong API design are essential.");
  const [tpl, setTpl] = useState("modern");
  const [len, setLen] = useState("1-page");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api.post<{ jobId: string }>(EP.generate, { job_title: jobTitle, company_name: company, job_description: jd, template_id: tpl, page_length: len });
      onStart(r.data.jobId);
    } catch {
      // If API isn't available, simulate with a fake job ID
      onStart("demo-job-123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader overline="New resume" title="Who are you crafting for?" />

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
          <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} leading={<Briefcase size={16} strokeWidth={1.9} />} placeholder="Staff Software Engineer" />
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} leading={<Building2 size={16} strokeWidth={1.9} />} placeholder="Vela Systems" />
        </div>
        <div style={{ marginBottom: 22 }}>
          <Textarea
            label="Paste the job description"
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            hint="We analyze this to extract required skills, seniority and tech stack."
          />
        </div>

        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Template</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 }}>
          {TEMPLATES.map((t) => (
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
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{t.name}</span>
                {tpl === t.id && <CheckCircle2 size={17} strokeWidth={1.9} color="var(--brass-600)" />}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginTop: 4, lineHeight: 1.4 }}>{t.note}</div>
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
              }}
            >{l}</button>
          ))}
        </div>

        {error && <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-600)", marginBottom: 16 }}>{error}</div>}

        <Button type="submit" variant="gold" size="lg" disabled={loading} iconLeft={<Sparkles size={18} strokeWidth={1.9} />}>
          {loading ? "Starting…" : "Craft my resume"}
        </Button>
      </form>
    </div>
  );
}

function GenRunning({ jobId, onDone }: { jobId: string; onDone: (resumeId: string) => void }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct] = useState(4);
  const [completed, setCompleted] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = () => {
      api.get<{ status: string; resume_id?: string; progress?: number }>(EP.generateStatus(jobId))
        .then((r) => {
          const { status, resume_id, progress } = r.data;
          if (progress !== undefined) setPct(progress);
          const idx = GEN_STAGES.findIndex((s) => s.key === status);
          if (idx >= 0) setStageIdx(idx);
          if (status === "completed") {
            setCompleted(true);
            setResumeId(resume_id || "demo-resume-1");
            if (timerRef.current) clearInterval(timerRef.current);
          }
        })
        .catch(() => {});
    };

    timerRef.current = setInterval(poll, 2000);

    // Demo fallback — animate locally if API isn't up
    const demoId = setInterval(() => {
      setPct((p) => {
        const np = p + 3 + Math.random() * 4;
        if (np >= 100) {
          clearInterval(demoId);
          setCompleted(true);
          setResumeId("demo-resume-1");
          return 100;
        }
        setStageIdx(Math.min(GEN_STAGES.length - 1, Math.floor(np / (100 / GEN_STAGES.length))));
        return np;
      });
    }, 180);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(demoId);
    };
  }, [jobId]);

  if (completed) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
        <div style={{ animation: "sig-spin 0.6s ease-out forwards", marginBottom: 24 }}>
          <Seal size={180} />
        </div>
        <Badge tone="success" dot>Signed</Badge>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, color: "var(--ink-900)", margin: "16px 0 8px", letterSpacing: "-0.01em" }}>
          Your resume is signed.
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--slate-700)", margin: "0 0 28px", maxWidth: 380 }}>
          Crafted around who you are — and ready for who you'll become.
        </p>
        <Button variant="gold" size="lg" iconRight={<ArrowRight size={18} strokeWidth={1.9} />} onClick={() => onDone(resumeId || "demo-resume-1")}>
          View your resume
        </Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, background: "var(--paper-100)" }}>
      <div style={{ position: "relative", marginBottom: 30 }}>
        <Seal size={150} />
        <span style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px solid var(--brass-300)", borderTopColor: "var(--brass-600)", animation: "sig-spin 1.1s linear infinite", pointerEvents: "none" }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 34, color: "var(--ink-900)", margin: "0 0 6px", letterSpacing: "-0.01em" }}>Crafting your resume…</h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--slate-700)", margin: "0 0 28px" }}>{GEN_STAGES[stageIdx].detail}</p>

      <div style={{ width: 480, maxWidth: "100%" }}>
        <div style={{ height: 8, background: "var(--paper-300)", borderRadius: "var(--radius-pill)", overflow: "hidden", boxShadow: "var(--shadow-inset)" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--brass-400), var(--brass-600))", borderRadius: "var(--radius-pill)", transition: "width 180ms linear" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          {GEN_STAGES.map((s, i) => (
            <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                background: i < stageIdx ? "var(--brass-500)" : i === stageIdx ? "var(--paper-50)" : "var(--paper-200)",
                color: i < stageIdx ? "var(--ink-900)" : "var(--slate-400)",
                border: `2px solid ${i <= stageIdx ? "var(--brass-500)" : "var(--line-300)"}`,
              }}>
                {i < stageIdx ? "✓" : i + 1}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: i === stageIdx ? 700 : 500, color: i === stageIdx ? "var(--ink-900)" : "var(--slate-400)", textAlign: "center" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GeneratePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"form" | "running">("form");
  const [jobId, setJobId] = useState<string | null>(null);

  if (phase === "form") {
    return <GenForm onStart={(id) => { setJobId(id); setPhase("running"); }} />;
  }
  return <GenRunning jobId={jobId!} onDone={(id) => navigate(`/resumes/${id}`)} />;
}
