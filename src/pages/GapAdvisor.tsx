import React, { useState } from "react";
import { Target, Hammer, BookOpen, RefreshCw, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { Tag } from "@/components/data-display/Tag";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";

const MOCK_GAP = {
  career_goal: "Become a Staff Software Engineer working on developer platforms within 3 years.",
  missingSkills: [
    { skill: "Kubernetes", priority: "High", reason: "Core to platform/infra roles at the Staff level." },
    { skill: "Observability (OpenTelemetry)", priority: "High", reason: "Increasingly expected for senior platform work." },
    { skill: "Team Leadership", priority: "Medium", reason: "Strengthens the path from Senior to Staff." },
  ],
  suggestedProjects: [
    { projectType: "Platform", description: "Build a multi-tenant deploy pipeline on Kubernetes.", skillsAddressed: ["Kubernetes", "CI/CD"] },
    { projectType: "Observability", description: "Instrument an existing service end-to-end with OpenTelemetry.", skillsAddressed: ["Observability", "Tracing"] },
  ],
  learningResources: [
    { resource: "Kubernetes Up & Running", skillAddressed: "Kubernetes" },
    { resource: "Distributed Systems for Practitioners", skillAddressed: "Distributed Systems" },
  ],
};

type Priority = "High" | "Medium" | "Low";
const PRIO_TONE: Record<Priority, "danger" | "warning" | "neutral"> = {
  High: "danger",
  Medium: "warning",
  Low: "neutral",
};

function SecTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {icon}
      <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)" }}>{children}</span>
    </div>
  );
}

export function GapAdvisorPage() {
  const { data: gapData, setData } = useApi<typeof MOCK_GAP>(EP.gapAnalysis);
  const [refreshing, setRefreshing] = useState(false);
  const gap = gapData || MOCK_GAP;

  const rerun = async () => {
    setRefreshing(true);
    try {
      const r = await api.post<typeof MOCK_GAP>(EP.gapAnalysis);
      setData(r.data);
    } catch {}
    setRefreshing(false);
  };

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader overline="Gap Advisor" title="The road to your goal">
        <Button variant="secondary" iconLeft={<RefreshCw size={15} strokeWidth={1.9} />} onClick={rerun} disabled={refreshing}>
          {refreshing ? "Running…" : "Re-run analysis"}
        </Button>
      </PageHeader>

      <Card variant="seal" padding="22px 24px" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 8 }}>Your goal</div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 23, color: "var(--ink-900)", lineHeight: 1.3 }}>"{gap.career_goal}"</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <SecTitle icon={<Target size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Skills to close the gap</SecTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gap.missingSkills.map((m) => (
              <Card key={m.skill} padding="16px 18px">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{m.skill}</span>
                  <Badge tone={PRIO_TONE[m.priority as Priority]}>{m.priority} priority</Badge>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", textAlign: "right", maxWidth: 360 }}>{m.reason}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SecTitle icon={<Hammer size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Projects to build</SecTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {gap.suggestedProjects.map((p, i) => (
              <Card key={i} padding="16px 18px">
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 6 }}>{p.projectType}</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", margin: "0 0 10px", lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.skillsAddressed.map((s) => <Tag key={s} tone="gold">{s}</Tag>)}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SecTitle icon={<BookOpen size={18} strokeWidth={1.9} color="var(--ink-600)" />}>Learn next</SecTitle>
          <Card padding="6px 4px">
            {gap.learningResources.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < gap.learningResources.length - 1 ? "1px solid var(--line-200)" : "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={16} strokeWidth={1.9} color="var(--ink-700)" />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{r.resource}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)" }}>Builds {r.skillAddressed}</div>
                </div>
                <ExternalLink size={15} strokeWidth={1.9} color="var(--slate-400)" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
