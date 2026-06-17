import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Stamp, Check, AlertTriangle, Lightbulb, Sparkle, Download, Link, X } from "lucide-react";
import { Tabs } from "@/components/navigation/Tabs";
import { Button } from "@/components/core/Button";
import { Badge } from "@/components/data-display/Badge";
import { Tag } from "@/components/data-display/Tag";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { Seal } from "@/components/brand/Seal";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";

const MOCK_RESUME = {
  version_label: "SWE-Vela-v2",
  status: "draft",
  job_title: "Staff Software Engineer",
  company_name: "Vela Systems",
  template_id: "modern",
  page_length: "1-page",
  content: {
    name: "Ada Lovelace",
    title: "Staff Software Engineer",
    email: "ada@signuture.com",
    location: "London, UK",
    summary: "Platform engineer who builds distributed systems that feel human. A decade turning ambiguous problems into resilient products — and teams into something better than they were.",
    experience: [
      { title: "Software Engineer", company: "Babbage Labs", start: "2023", end: "Present", desc: "Shipped the notation engine still used by 200k authors today." },
      { title: "Engineering Intern", company: "Analytical Engines Co.", start: "2022", end: "2022", desc: "Built internal tooling that cut deploy time across 12 services." },
    ],
    projects: [
      { title: "Lovelace Notation Engine", stack: ["TypeScript", "Rust", "WASM"] },
      { title: "Threads — distributed queue", stack: ["Go", "PostgreSQL", "gRPC"] },
    ],
    skills: ["Systems Design", "TypeScript", "Rust", "Distributed Data", "Go", "Mentorship"],
  },
};

const MOCK_ATS = {
  score: 88,
  foundKeywords: ["Distributed Systems", "Go", "API Design", "Mentorship", "gRPC", "PostgreSQL", "TypeScript"],
  missingKeywords: ["Kubernetes", "Observability"],
  suggestions: [
    "Add Kubernetes to your skills — it appears 4× in the job description.",
    "Quantify the Babbage Labs deploy-time win with a concrete number.",
    "Mention observability tooling (tracing, metrics) in your latest role.",
  ],
};

const MOCK_COVER = `Dear Vela Systems Hiring Team,

When I read that you treat developer experience as a product rather than an afterthought, it felt less like a job description and more like a description of the work I've been trying to do my whole career.

At Babbage Labs I built the notation engine now used by 200,000 authors, and along the way learned that resilient systems and resilient teams are built the same way — with care, clarity, and a refusal to ship something you wouldn't sign your name to.

I'd be proud to bring that to your platform team.

Warmly,`;

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

function PSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brass-700)", margin: "0 0 9px", borderBottom: "1px solid var(--line-200)", paddingBottom: 6 }}>{title}</h2>
      {children}
    </section>
  );
}

function ExportModal({ onClose }: { onClose: () => void }) {
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
          <Button variant="gold" iconLeft={<Download size={16} strokeWidth={1.9} />}>Download PDF</Button>
          <Button variant="secondary" iconLeft={<Link size={16} strokeWidth={1.9} />}>Copy link</Button>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)" }}>
          <X size={20} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}

export function ResumeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("resume");
  const [exporting, setExporting] = useState(false);

  const { data: resumeData } = useApi<typeof MOCK_RESUME>(id ? EP.resume(id) : "");
  const { data: atsData } = useApi<typeof MOCK_ATS>(id ? EP.ats(id) : "");

  const resume = resumeData || MOCK_RESUME;
  const ats = atsData || MOCK_ATS;
  const content = resume.content;

  const handleExport = async () => {
    if (id) {
      try { await api.post(EP.resumeExport(id)); } catch {}
    }
    setExporting(true);
  };

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
              {resume.job_title} · {resume.company_name} · {resume.template_id} · {resume.page_length}
            </div>
          </div>
          <Badge tone="neutral">{resume.status === "draft" ? "Draft" : resume.status}</Badge>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="sm" iconLeft={<Copy size={14} strokeWidth={1.9} />}>Duplicate</Button>
          <Button variant="gold" size="sm" iconLeft={<Stamp size={15} strokeWidth={1.9} />} onClick={handleExport}>Sign & Export</Button>
        </div>
      </div>

      <Tabs items={[{ id: "resume", label: "Resume" }, { id: "cover", label: "Cover Letter" }]} value={tab} onChange={setTab} style={{ marginBottom: 0 }} />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, marginTop: 24 }}>
        {/* paper preview */}
        <div>
          {tab === "resume" ? (
            <div style={{ background: "var(--white)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: "48px 52px", minHeight: 780 }}>
              <div style={{ borderBottom: "2px solid var(--brass-500)", paddingBottom: 16, marginBottom: 22 }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, color: "var(--ink-900)", margin: 0, letterSpacing: "-0.01em" }}>{content.name}</h1>
                <div style={{ display: "flex", gap: 14, marginTop: 6, fontFamily: "var(--font-body)", fontSize: 12.5 }}>
                  <span style={{ color: "var(--brass-800)", fontWeight: 600 }}>{content.title}</span>
                  <span style={{ color: "var(--slate-500)" }}>{content.email}</span>
                  <span style={{ color: "var(--slate-500)" }}>{content.location}</span>
                </div>
              </div>
              <PSec title="Summary">
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, lineHeight: 1.6, color: "var(--slate-700)", margin: 0 }}>{content.summary}</p>
              </PSec>
              <PSec title="Experience">
                {content.experience.map((e, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--ink-900)" }}>{e.title} · {e.company}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--slate-500)" }}>{e.start} — {e.end}</span>
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.5, color: "var(--slate-700)", margin: "4px 0 0" }}>{e.desc}</p>
                  </div>
                ))}
              </PSec>
              <PSec title="Projects">
                {content.projects.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14, color: "var(--ink-900)" }}>{p.title}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}> — {p.stack.join(", ")}</span>
                  </div>
                ))}
              </PSec>
              <PSec title="Skills">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {content.skills.map((s) => <Tag key={s} tone="blue">{s}</Tag>)}
                </div>
              </PSec>
            </div>
          ) : (
            <div style={{ background: "var(--white)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: "52px 56px", minHeight: 780, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.7, color: "var(--slate-700)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, color: "var(--ink-900)", marginBottom: 24 }}>{content.name}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{MOCK_COVER}</div>
              <div style={{ fontFamily: "var(--font-script)", fontSize: 30, color: "var(--ink-900)", marginTop: 16 }}>{content.name}</div>
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
                    <ScoreRing value={ats.score} />
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--slate-700)" }}>ATS match score</div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <Check size={15} strokeWidth={1.9} color="var(--success-600)" />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Matched keywords</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ats.foundKeywords.map((k) => <Tag key={k} tone="blue">{k}</Tag>)}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <AlertTriangle size={15} strokeWidth={1.9} color="var(--danger-600)" />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Missing keywords</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ats.missingKeywords.map((k) => <Tag key={k} tone="neutral">{k}</Tag>)}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <Lightbulb size={15} strokeWidth={1.9} color="var(--brass-700)" />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate-700)" }}>Suggestions</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {ats.suggestions.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, fontFamily: "var(--font-body)", fontSize: 12.5, lineHeight: 1.45, color: "var(--slate-700)" }}>
                          <Sparkle size={13} strokeWidth={1.9} color="var(--brass-600)" style={{ flexShrink: 0, marginTop: 1 }} />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>Shape your letter</div>
              <Select label="Tone" options={[{ value: "formal", label: "Formal" }, { value: "balanced", label: "Balanced" }, { value: "conversational", label: "Conversational" }]} defaultValue="balanced" />
              <Textarea label="Why this company?" rows={4} defaultValue="Vela's bet on developer experience as a product, not an afterthought, is exactly the work I want to do for the next decade." />
              <Textarea label="Anything to highlight? (optional)" rows={2} placeholder="A specific win, a connection…" />
              <Button variant="gold" block iconLeft={<Sparkle size={16} strokeWidth={1.9} />}>Generate cover letter</Button>
            </div>
          )}
        </aside>
      </div>

      {exporting && <ExportModal onClose={() => setExporting(false)} />}
    </div>
  );
}
