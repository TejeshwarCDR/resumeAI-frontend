import React, { useState } from "react";
import { Target, Hammer, BookOpen, RefreshCw, ExternalLink, AlertCircle, Clock, FileText, TrendingUp, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
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
  evidence_level?: 0 | 1 | 2 | 3;
  supporting_projects?: string[];
  learning_path_order?: number;
  cluster_name?: string | null;
  semantic_similarity_score?: number;
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

interface PortfolioSnapshot {
  totalItems: number;
  projectCount: number;
  skillCount: number;
  hasGithubProjects: boolean;
  avgValidationScore: number | null;
}

interface StrengthMapping {
  assetId?: string;
  assetType: "project" | "certification" | "skill" | "experience" | "education" | "achievement";
  title: string;
  relevanceScore: number;
  priorityScore: number;
  matchedRequirements: string[];
  matchedKeywords: string[];
  missingRelatedKeywords: string[];
  strengthCategory: "excellent" | "strong" | "moderate" | "weak" | "low";
  reasoning: string;
  recommendedUsage: string;
  evidence: string[];
}

interface RankedProject {
  projectId: string;
  title: string;
  rank: number;
  relevanceScore: number;
  matchCategory: "excellent" | "strong" | "moderate" | "weak" | "low";
  matchedSkills: string[];
  matchedRequirements: string[];
  missingRelatedKeywords: string[];
  reasoning: string;
  recommendedUsage: "use_in_resume" | "improve_before_using" | "supporting_project" | "not_recommended";
  selectedForResume: boolean;
}

interface RankedCertification {
  certificationId?: string;
  name: string;
  issuer: string | null;
  rank: number;
  relevanceScore: number;
  matchedRequirements: string[];
  matchedSkills: string[];
  reasoning: string;
  recommendedUsage: "include" | "supporting" | "not_recommended";
}

interface GapRecommendation {
  title: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  severity: number;
  whyItMatters: string;
  evidence: string[];
  suggestedAction: string;
  suggestedProjectIdea?: string;
  suggestedCertification?: string;
  suggestedSkill?: string;
  estimatedImpact: "high" | "medium" | "low";
}

interface GapAnalysisData {
  id: string;
  career_goal: string;
  analysis_mode?: "career_goal" | "jd_comparison";
  missing_skills: MissingSkill[];
  suggested_projects: SuggestedProject[];
  learning_resources: LearningResource[];
  generated_at: string;
  overall_assessment?: string | null;
  portfolio_snapshot?: PortfolioSnapshot | null;
  overall_match_score?: number | string | null;
  strengths?: StrengthMapping[];
  ranked_projects?: RankedProject[];
  ranked_certifications?: RankedCertification[];
  gaps?: GapRecommendation[];
  selected_project_ids?: string[];
  recommended_project_count?: number | null;
  _stale?: boolean;
  _staleAfterDays?: number;
}

const JD_MIN_LENGTH = 50;
const JD_MAX_LENGTH = 20_000;

const PRIO_TONE: Record<MissingSkill["priority"], "danger" | "warning" | "neutral"> = {
  high: "danger", medium: "warning", low: "neutral",
};
const PRIO_LABEL: Record<MissingSkill["priority"], string> = {
  high: "High priority", medium: "Medium priority", low: "Low priority",
};
const GAP_TONE: Record<GapRecommendation["priority"], "danger" | "warning" | "neutral"> = {
  critical: "danger", high: "danger", medium: "warning", low: "neutral",
};
const MATCH_LABEL: Record<RankedProject["matchCategory"], string> = {
  excellent: "Excellent Match",
  strong: "Strong Match",
  moderate: "Moderate Match",
  weak: "Weak Match",
  low: "Low Match",
};
const USAGE_LABEL: Record<RankedProject["recommendedUsage"], string> = {
  use_in_resume: "Recommended for Resume",
  improve_before_using: "Improve Before Using",
  supporting_project: "Supporting Project",
  not_recommended: "Not Recommended for This Role",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const EVIDENCE_COLORS: Record<0 | 1 | 2 | 3, { bg: string; text: string; label: string }> = {
  0: { bg: "#fee2e2", text: "#991b1b", label: "Not in portfolio" },
  1: { bg: "#fef3c7", text: "#92400e", label: "Listed only" },
  2: { bg: "#dbeafe", text: "#1e40af", label: "Demonstrated" },
  3: { bg: "#d1fae5", text: "#065f46", label: "Proven" },
};

function EvidenceBadge({ level }: { level: 0 | 1 | 2 | 3 }) {
  const { bg, text, label } = EVIDENCE_COLORS[level] ?? EVIDENCE_COLORS[0];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 12,
      background: bg, color: text,
      fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
    }}>
      {label}
    </span>
  );
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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "var(--danger-50, #fef2f2)", border: "1px solid var(--danger-200, #fecaca)",
      borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: 20,
      fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-700, #b91c1c)",
    }}>
      <AlertCircle size={16} strokeWidth={1.9} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

function friendlyErrorMessage(rawError: string | null, status?: number): string {
  if (!rawError) return "Something went wrong. Please try again.";
  const lower = rawError.toLowerCase();

  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 422 || lower.includes("career goal")) {
    return "Please set a career goal in your profile settings before running gap analysis.";
  }
  if (lower.includes("no projects or skills") || lower.includes("portfolio has no")) {
    return "Your portfolio needs at least one project or skill before running gap analysis.";
  }
  if (status === 503 || lower.includes("ai service") || lower.includes("temporarily unavailable")) {
    return "The AI service is temporarily unavailable. Your deterministic analysis will still be shown — try re-running for full narrative.";
  }
  if (status === 400 || lower.includes("job description must be")) {
    return rawError;
  }
  return rawError;
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: data.overall_assessment ? 16 : 22, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-400)" }}>
            <Clock size={13} strokeWidth={1.9} />
            Last analysed {formatDate(data.generated_at)}
            {data.analysis_mode === "jd_comparison" && (
              <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Briefcase size={11} strokeWidth={2} />
                JD comparison
              </span>
            )}
            {data._stale && (
              <span style={{ marginLeft: 6, color: "var(--brass-600)", fontWeight: 600 }}>
                · {data._staleAfterDays}d old — consider re-running
              </span>
            )}
          </div>
          {data.portfolio_snapshot && (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-400)" }}>
              Based on {data.portfolio_snapshot.projectCount} project{data.portfolio_snapshot.projectCount === 1 ? "" : "s"}
              {data.portfolio_snapshot.avgValidationScore != null && (
                <> · avg quality {Math.round(data.portfolio_snapshot.avgValidationScore)}</>
              )}
              {data.portfolio_snapshot.hasGithubProjects && (
                <> · includes GitHub</>
              )}
            </div>
          )}
          <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={14} strokeWidth={1.9} />} onClick={onRerun} disabled={rerunning}>
            {rerunning ? "Running…" : "Re-run"}
          </Button>
        </div>
      )}

      {data.overall_assessment && (
        <div style={{ marginBottom: 22, padding: "14px 18px", background: "var(--ink-50)", borderLeft: "3px solid var(--brass-500)", borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.6, color: "var(--ink-700)", margin: 0 }}>
            {data.overall_assessment}
          </p>
        </div>
      )}

      {data.overall_match_score != null && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
          {[
            { label: "Overall Match", value: `${Math.round(Number(data.overall_match_score))}%` },
            { label: "Strong Assets", value: String((data.strengths ?? []).filter((s) => s.priorityScore >= 75).length) },
            { label: "Critical Gaps", value: String((data.gaps ?? []).filter((g) => g.priority === "critical").length) },
            { label: "Projects Selected", value: String((data.selected_project_ids ?? []).length || data.recommended_project_count || 0) },
          ].map((item) => (
            <Card key={item.label} padding="14px 16px">
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--slate-400)", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--ink-900)" }}>{item.value}</div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {(data.strengths ?? []).length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <SecTitle icon={<TrendingUp size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Strengths mapped to this role</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {(data.strengths ?? []).slice(0, 6).map((strength) => (
                <Card key={`${strength.assetType}-${strength.assetId ?? strength.title}`} padding="14px 16px">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{strength.title}</div>
                    <Badge tone={strength.priorityScore >= 75 ? "success" : "neutral"}>{Math.round(strength.priorityScore)}</Badge>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-400)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{strength.assetType}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, lineHeight: 1.45, color: "var(--slate-600)", margin: "0 0 8px" }}>{strength.reasoning}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {strength.matchedKeywords.slice(0, 5).map((keyword) => <Tag key={keyword} tone="gold">{keyword}</Tag>)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(data.ranked_projects ?? []).length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <SecTitle icon={<Hammer size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Ranked projects</SecTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data.ranked_projects ?? []).map((project) => (
                <Card key={project.projectId} padding="14px 16px">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: project.selectedForResume ? "var(--brass-100)" : "var(--ink-100)", color: project.selectedForResume ? "var(--brass-700)" : "var(--slate-500)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>#{project.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{project.title}</span>
                        <Badge tone={project.selectedForResume ? "success" : "neutral"}>{project.selectedForResume ? "Selected" : "Not selected"}</Badge>
                        <Badge tone={project.relevanceScore >= 75 ? "success" : project.relevanceScore >= 55 ? "warning" : "neutral"}>{project.relevanceScore}</Badge>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-400)" }}>{MATCH_LABEL[project.matchCategory]} · {USAGE_LABEL[project.recommendedUsage]}</span>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-600)", lineHeight: 1.45, margin: "0 0 8px" }}>{project.reasoning}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {project.matchedSkills.slice(0, 6).map((skill) => <Tag key={skill} tone="gold">{skill}</Tag>)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(data.ranked_certifications ?? []).length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <SecTitle icon={<BookOpen size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Ranked certifications</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {(data.ranked_certifications ?? []).map((cert) => (
                <Card key={cert.certificationId ?? cert.name} padding="14px 16px">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{cert.name}</div>
                    <Badge tone={cert.relevanceScore >= 70 ? "success" : cert.relevanceScore >= 45 ? "warning" : "neutral"}>{cert.relevanceScore}</Badge>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", marginBottom: 6 }}>{cert.issuer || "Issuer not set"} · {cert.recommendedUsage.replace(/_/g, " ")}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-600)", lineHeight: 1.45, margin: 0 }}>{cert.reasoning}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(data.gaps ?? []).length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <SecTitle icon={<AlertCircle size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Priority gaps</SecTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data.gaps ?? []).slice(0, 8).map((gap) => (
                <Card key={`${gap.category}-${gap.title}`} padding="14px 16px">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{gap.title}</span>
                    <Badge tone={GAP_TONE[gap.priority]}>{gap.priority === "critical" ? "Critical Gap" : `${gap.priority} priority`}</Badge>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-400)" }}>{gap.category}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-600)", lineHeight: 1.45, margin: "0 0 6px" }}>{gap.whyItMatters}</p>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-700)" }}>{gap.suggestedAction}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Skills gap — full width */}
        <div style={{ gridColumn: "1 / -1" }}>
          <SecTitle icon={<Target size={18} strokeWidth={1.9} color="var(--ink-600)" />}>
            Skills to close the gap
          </SecTitle>
          {(data.missing_skills ?? []).length === 0 ? (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)", padding: "16px 0" }}>No skill gaps identified — great position!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.missing_skills.map((m) => (
                <Card key={m.skill} padding="14px 18px">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    {m.learning_path_order != null && (
                      <span style={{
                        width: 24, height: 24, borderRadius: "50%", background: "var(--brass-100)",
                        color: "var(--brass-700)", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                      }}>
                        {m.learning_path_order}
                      </span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{m.skill}</span>
                        <Badge tone={PRIO_TONE[m.priority]}>{PRIO_LABEL[m.priority]}</Badge>
                        {m.evidence_level != null && (
                          <EvidenceBadge level={m.evidence_level as 0 | 1 | 2 | 3} />
                        )}
                        {m.cluster_name && (
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-400)" }}>
                            {m.cluster_name}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-600)", margin: "0 0 6px", lineHeight: 1.5 }}>
                        {m.reason}
                      </p>
                      {m.supporting_projects && m.supporting_projects.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-400)" }}>Related:</span>
                          {m.supporting_projects.slice(0, 3).map(proj => (
                            <span key={proj} style={{
                              fontFamily: "var(--font-body)", fontSize: 11, color: "var(--slate-500)",
                              background: "var(--ink-100)", padding: "1px 6px", borderRadius: 4,
                            }}>
                              {proj}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <SecTitle icon={<Hammer size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Projects to build</SecTitle>
          {(data.suggested_projects ?? []).length === 0 ? (
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)" }}>No project suggestions yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.suggested_projects.map((p, i) => (
                <Card key={i} padding="16px 18px">
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 6 }}>{p.project_type}</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", margin: "0 0 10px", lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(p.skills_addressed ?? []).map((s) => <Tag key={s} tone="gold">{s}</Tag>)}
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
            {(data.learning_resources ?? []).length === 0 ? (
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
                    <a href={r.url} target="_blank" rel="noreferrer noopener" style={{ color: "var(--slate-400)", display: "inline-flex" }}>
                      <ExternalLink size={15} strokeWidth={1.9} />
                    </a>
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

function AnalysisRail({
  data,
  onRerun,
  rerunning,
  mode,
}: {
  data: GapAnalysisData | null | undefined;
  onRerun: () => void;
  rerunning: boolean;
  mode: "career" | "jd";
}) {
  const score = data?.overall_match_score != null ? Math.round(Number(data.overall_match_score)) : null;
  const criticalGaps = (data?.gaps ?? []).filter((gap) => gap.priority === "critical").length;
  const selectedProjects = (data?.selected_project_ids ?? []).length || data?.recommended_project_count || 0;

  return (
    <aside className="sig-rail">
      <Card variant="seal" padding="22px">
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 10 }}>
          Analysis summary
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1 }}>
          {score != null ? `${score}%` : "—"}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", marginTop: 6 }}>
          {score != null ? "Overall target match" : "Run an analysis to calculate match score"}
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          {[
            ["Mode", mode === "jd" ? "Job description" : "Career goal"],
            ["Projects", String(data?.portfolio_snapshot?.projectCount ?? 0)],
            ["Selected", String(selectedProjects)],
            ["Critical gaps", String(criticalGaps)],
            ["Last analysed", data?.generated_at ? formatDate(data.generated_at) : "Not yet"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontFamily: "var(--font-body)", fontSize: 13 }}>
              <span style={{ color: "var(--slate-500)" }}>{label}</span>
              <span style={{ color: "var(--ink-900)", fontWeight: 700, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="20px">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>
          Quick actions
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <Button variant="secondary" iconLeft={<RefreshCw size={14} strokeWidth={1.9} />} onClick={onRerun} disabled={rerunning}>
            {rerunning ? "Running…" : "Re-run analysis"}
          </Button>
          <Button variant="gold" iconLeft={<FileText size={14} strokeWidth={1.9} />} onClick={() => { window.location.href = "/generate"; }}>
            Generate targeted resume
          </Button>
        </div>
      </Card>

      <Card padding="20px">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>
          What this uses
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.55, color: "var(--slate-600)", margin: 0 }}>
          Projects, skills, certifications, experience, education, and GitHub-imported repositories are mapped against your target.
        </p>
      </Card>
    </aside>
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

  const jdCharCount = jdText.length;
  const jdTooShort = jdCharCount > 0 && jdCharCount < JD_MIN_LENGTH;
  const jdTooLong = jdCharCount > JD_MAX_LENGTH;
  const jdValid = jdCharCount >= JD_MIN_LENGTH && jdCharCount <= JD_MAX_LENGTH;

  const rerun = async () => {
    setRefreshing(true);
    setRunError(null);
    try {
      const r = await api.post<GapAnalysisData>(EP.gapAnalysis, {});
      setData(r.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed. Please try again.";
      const status = (e as { status?: number }).status;
      setRunError(friendlyErrorMessage(msg, status));
    } finally {
      setRefreshing(false);
    }
  };

  const runJdAnalysis = async () => {
    if (!jdValid) {
      if (jdTooShort) setJdError(`Please paste a job description (at least ${JD_MIN_LENGTH} characters).`);
      else if (jdTooLong) setJdError(`Job description must be at most ${JD_MAX_LENGTH.toLocaleString()} characters.`);
      return;
    }
    setJdError(null);
    setJdRunning(true);
    setJdResult(null);
    try {
      const r = await api.post<GapAnalysisData>(EP.gapAnalysis, { jobDescription: jdText, save: false });
      setJdResult(r.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Analysis failed. Please try again.";
      const status = (e as { status?: number }).status;
      setJdError(friendlyErrorMessage(msg, status));
    } finally {
      setJdRunning(false);
    }
  };

  const noAnalysisYet = !gapData && !loading && isNoAnalysisError(error);
  const fetchError = !gapData && !loading && !!error && !noAnalysisYet;

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="Gap Advisor"
        title="The road to your goal"
        subtitle="Compare your portfolio against a career goal or job description, then use the ranking to generate a more targeted resume."
      >
        <Button variant="secondary" iconLeft={<RefreshCw size={15} strokeWidth={1.9} />} onClick={rerun} disabled={refreshing || loading}>
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

      <div className="sig-page-with-rail">
        <section className="sig-main-column">

      {/* Career goal tab */}
      {activeTab === "career" && (
        <>
          {runError && <ErrorBanner message={runError} />}

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
              <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-500)", textAlign: "center", maxWidth: 360 }}>
                {friendlyErrorMessage(error)}
              </div>
              <Button variant="secondary" onClick={rerun} disabled={refreshing}>{refreshing ? "Retrying…" : "Try again"}</Button>
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
              <Button variant="gold" iconLeft={<RefreshCw size={15} strokeWidth={1.9} />} onClick={rerun}>Run gap analysis</Button>
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
              onChange={(e) => { setJdText(e.target.value); if (jdError) setJdError(null); }}
              placeholder="Paste the full job description here…"
              hint="The more complete the description, the more precise the gap analysis."
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: 11,
                color: jdTooLong ? "var(--danger-600, #dc2626)" : jdTooShort ? "var(--brass-600)" : "var(--slate-400)",
              }}>
                {jdCharCount.toLocaleString()} / {JD_MAX_LENGTH.toLocaleString()} characters
              </span>
            </div>
            {jdError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--danger-700, #b91c1c)", marginTop: 10, padding: "10px 14px", background: "var(--danger-50, #fef2f2)", borderRadius: "var(--radius-md)" }}>
                <AlertCircle size={15} strokeWidth={1.9} />
                {jdError}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button
                variant="gold"
                iconLeft={<FileText size={16} strokeWidth={1.9} />}
                onClick={runJdAnalysis}
                disabled={jdRunning || !jdText.trim() || jdTooShort || jdTooLong}
              >
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
              <AnalysisResults data={jdResult} onRerun={runJdAnalysis} rerunning={jdRunning} />
            </>
          )}

          {!jdResult && !jdRunning && (
            <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--slate-400)" }}>
              Paste a job description above and click Analyse to see results.
            </div>
          )}
        </div>
      )}
        </section>
        <AnalysisRail
          data={activeTab === "career" ? gapData : jdResult}
          onRerun={activeTab === "career" ? rerun : runJdAnalysis}
          rerunning={activeTab === "career" ? refreshing : jdRunning}
          mode={activeTab === "career" ? "career" : "jd"}
        />
      </div>
    </PageContainer>
  );
}
