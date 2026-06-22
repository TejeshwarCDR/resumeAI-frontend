import React, { useState } from "react";
import { Target, Hammer, BookOpen, RefreshCw, ExternalLink, AlertCircle, Clock, FileText, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { Tag } from "@/components/data-display/Tag";
import { Textarea } from "@/components/forms/Textarea";
import { Tabs } from "@/components/navigation/Tabs";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";

interface MissingSkill {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface SuggestedProject {
  project_type: string;
  description: string;
  skills_addressed: string[];
}

interface LearningResource {
  resource: string;
  url?: string;
  skill_addressed: string;
}

interface GapAnalysisData {
  id: string;
  career_goal: string;
  missing_skills: MissingSkill[];
  suggested_projects: SuggestedProject[];
  learning_resources: LearningResource[];
  generated_at: string;
}

const PRIO_TONE: Record<MissingSkill["priority"], "danger" | "warning" | "neutral"> = {
  high: "danger", medium: "warning", low: "neutral",
};
const PRIO_LABEL: Record<MissingSkill["priority"], string> = {
  high: "High priority", medium: "Medium priority", low: "Low priority",
};

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

function SecTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {icon}
      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>{children}</span>
    </div>
  );
}

function Spinner() {
  return <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--paper-300)", borderTopColor: "var(--brass-500)", animation: "sig-spin 1s linear infinite" }} />;
}

function isNoAnalysisError(msg: string | null) {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return lower.includes("no gap analysis") || lower.includes("not found");
}

function AnalysisResults({ data, onRerun, rerunning }: { data: GapAnalysisData; onRerun: () => void; rerunning: boolean }) {
  return (
    <>
      <Card variant="seal" padding="22px 24px" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 8 }}>
          Your goal
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--ink-900)", lineHeight: 1.35 }}>
          "{data.career_goal}"
        </div>
      </Card>

      {data.generated_at && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-400)" }}>
            <Clock size={13} strokeWidth={1.9} />
            Last analysed {formatDate(data.generated_at)}
          </div>
          <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} strokeWidth={1.9} />} onClick={onRerun} disabled={rerunning}>
            {rerunning ? "Running…" : "Re-run"}
          </Button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {/* Skills gap — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <SecTitle icon={<Target size={18} strokeWidth={1.9} color="var(--ink-600)" />}>
            Skills to close the gap
          </SecTitle>
          {data.missing_skills.length === 0 ? (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)", padding: "16px 0" }}>No skill gaps identified — great position!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.missing_skills.map((m) => (
                <Card key={m.skill} padding="14px 18px">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{m.skill}</span>
                    <Badge tone={PRIO_TONE[m.priority]}>{PRIO_LABEL[m.priority]}</Badge>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", textAlign: "right", maxWidth: 380 }}>{m.reason}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <SecTitle icon={<Hammer size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Projects to build</SecTitle>
          {data.suggested_projects.length === 0 ? (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)" }}>No project suggestions yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.suggested_projects.map((p, i) => (
                <Card key={i} padding="16px 18px">
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 6 }}>{p.project_type}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", margin: "0 0 10px", lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {p.skills_addressed.map((s) => <Tag key={s} tone="gold">{s}</Tag>)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Learning resources */}
        <div>
          <SecTitle icon={<BookOpen size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Learn next</SecTitle>
          <Card padding="6px 4px">
            {data.learning_resources.length === 0 ? (
              <div style={{ padding: "16px", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)" }}>No resources yet.</div>
            ) : (
              data.learning_resources.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < data.learning_resources.length - 1 ? "1px solid var(--line-200)" : "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen size={16} strokeWidth={1.9} color="var(--ink-700)" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{r.resource}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)" }}>Builds {r.skill_addressed}</div>
                  </div>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "var(--slate-400)", display: "inline-flex" }}><ExternalLink size={15} strokeWidth={1.9} /></a>
                  ) : (
                    <ExternalLink size={15} strokeWidth={1.9} color="var(--slate-300)" />
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export function GapAdvisorPage() {
  const { data: gapData, loading, error, setData } = useApi<GapAnalysisData>(EP.gapAnalysis);
  const [refreshing, setRefreshing] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("career");

  // JD comparison mode
  const [jdText, setJdText] = useState("");
  const [jdRunning, setJdRunning] = useState(false);
  const [jdResult, setJdResult] = useState<GapAnalysisData | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);

  const rerun = async (jd?: string) => {
    setRefreshing(true);
    setRunError(null);
    try {
      const r = await api.post<GapAnalysisData>(EP.gapAnalysis, jd ? { jobDescription: jd } : {});
      setData(r.data);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const runJdAnalysis = async () => {
    if (!jdText.trim() || jdText.trim().length < 50) {
      setJdError("Please paste a job description (at least 50 characters).");
      return;
    }
    setJdError(null);
    setJdRunning(true);
    try {
      const r = await api.post<GapAnalysisData>(EP.gapAnalysis, { jobDescription: jdText, save: false });
      setJdResult(r.data);
    } catch (e) {
      setJdError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setJdRunning(false);
    }
  };

  const noAnalysisYet = !gapData && !loading && isNoAnalysisError(error);
  const fetchError = !gapData && !loading && !!error && !noAnalysisYet;

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader overline="Gap Advisor" title="The road to your goal">
        <Button variant="secondary" iconLeft={<RefreshCw size={15} strokeWidth={1.9} />} onClick={() => rerun()} disabled={refreshing || loading}>
          {refreshing ? "Running…" : "Re-run analysis"}
        </Button>
      </PageHeader>

      <Tabs
        items={[
          { id: "career", label: "Career goal analysis" },
          { id: "jd", label: "Compare with job description" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 24 }}
      />

      {/* Career goal tab */}
      {activeTab === "career" && (
        <>
          {runError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--danger-50, #fef2f2)", border: "1px solid var(--danger-200, #fecaca)", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-700, #b91c1c)" }}>
              <AlertCircle size={16} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              {runError}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
              <Spinner />
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-500)" }}>Loading analysis…</div>
            </div>
          )}

          {fetchError && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <AlertCircle size={40} strokeWidth={1.4} color="var(--danger-400, #f87171)" />
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)" }}>Something went wrong</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", textAlign: "center", maxWidth: 360 }}>{error}</div>
              <Button variant="secondary" onClick={() => rerun()} disabled={refreshing}>{refreshing ? "Retrying…" : "Try again"}</Button>
            </div>
          )}

          {noAnalysisYet && !refreshing && (
            <Card padding="48px 40px" style={{ textAlign: "center", marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--brass-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={26} strokeWidth={1.6} color="var(--brass-700)" />
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--ink-900)", marginBottom: 12 }}>No analysis yet</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.6, color: "var(--slate-500)", margin: "0 auto 28px", maxWidth: 400 }}>
                Run your first gap analysis to discover which skills to build, projects to pursue, and resources to study on your path to your career goal.
              </p>
              <Button variant="gold" iconLeft={<RefreshCw size={15} strokeWidth={1.9} />} onClick={() => rerun()}>Run gap analysis</Button>
            </Card>
          )}

          {refreshing && !gapData && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, gap: 16 }}>
              <Spinner />
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-500)" }}>Running gap analysis — this may take a moment…</div>
            </div>
          )}

          {gapData && <AnalysisResults data={gapData} onRerun={rerun} rerunning={refreshing} />}
        </>
      )}

      {/* JD comparison tab */}
      {activeTab === "jd" && (
        <div>
          <Card padding="24px" style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--ink-900)", marginBottom: 6 }}>
              Compare your portfolio against a job description
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-600)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Paste a job description below and Signuture will identify which required skills you're missing, what to build, and what to study — tailored to that specific role.
            </p>
            <Textarea
              label="Job description"
              rows={7}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here…"
              hint="The more complete the description, the more precise the gap analysis."
            />
            {jdError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-700, #b91c1c)", marginTop: 10, padding: "10px 14px", background: "var(--danger-50, #fef2f2)", borderRadius: "var(--radius-md)" }}>
                <AlertCircle size={15} strokeWidth={1.9} />
                {jdError}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button variant="gold" iconLeft={<FileText size={16} strokeWidth={1.9} />} onClick={runJdAnalysis} disabled={jdRunning || !jdText.trim()}>
                {jdRunning ? "Analysing…" : "Analyse against this JD"}
              </Button>
            </div>
          </Card>

          {jdRunning && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 16 }}>
              <Spinner />
              <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-500)" }}>Comparing your portfolio against the job description…</div>
            </div>
          )}

          {jdResult && !jdRunning && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-600)", padding: "12px 16px", background: "var(--paper-200)", borderRadius: "var(--radius-md)", border: "1px solid var(--line-300)" }}>
                <FileText size={15} strokeWidth={1.9} color="var(--brass-600)" />
                Analysis tailored to your pasted job description — this result is not saved.
              </div>
              <AnalysisResults data={jdResult} onRerun={() => runJdAnalysis()} rerunning={jdRunning} />
            </>
          )}

          {!jdResult && !jdRunning && (
            <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)" }}>
              Paste a job description above and click Analyse to see results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
