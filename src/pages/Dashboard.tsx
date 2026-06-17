import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, FileText, Gauge, FolderOpen, Compass, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { ProgressMeter } from "@/components/data-display/ProgressMeter";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { useAuth } from "@/store/auth";

interface ResumeVersion {
  id: string;
  version_label: string;
  status: "draft" | "submitted" | "archived";
  ats_score: number;
  updated: string;
  role: string;
}

interface Completeness {
  percentage: number;
  message?: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: "neutral" | "success" | "warning"; label: string; dot?: boolean }> = {
    draft:     { tone: "warning", label: "Draft" },
    submitted: { tone: "success", label: "Submitted", dot: true },
    archived:  { tone: "neutral", label: "Archived" },
  };
  const cfg = map[status] || map.draft;
  return <Badge tone={cfg.tone} dot={cfg.dot}>{cfg.label}</Badge>;
}

function StatTile({ icon, label, value, suffix, tone }: { icon: React.ReactNode; label: string; value: string; suffix?: string; tone: "gold" | "blue" }) {
  const c = tone === "gold" ? "var(--brass-600)" : "var(--ink-600)";
  const bg = tone === "gold" ? "var(--brass-100)" : "var(--ink-100)";
  return (
    <Card padding="20px">
      <span style={{ width: 38, height: 38, borderRadius: "var(--radius-sm)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{icon}</span>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1 }}>
        {value}<span style={{ fontSize: 18, color: "var(--slate-400)" }}>{suffix}</span>
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-500)", marginTop: 4 }}>{label}</div>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: versions } = useApi<ResumeVersion[]>(EP.resumes);
  const { data: completeness } = useApi<Completeness>(EP.completeness);

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const vList = versions || [];
  const pct = completeness?.percentage ?? 82;

  return (
    <div style={{ maxWidth: 1040 }}>
      <PageHeader overline={`Welcome back, ${firstName}`} title={`${greeting}, ${firstName}.`}>
        <Button variant="gold" iconLeft={<Sparkles size={16} strokeWidth={1.9} />} onClick={() => navigate("/generate")}>
          Craft a resume
        </Button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 22 }}>
        <StatTile icon={<FileText size={19} strokeWidth={1.9} color="var(--ink-600)" />} label="Resume versions" value={String(vList.length || 3)} tone="blue" />
        <StatTile icon={<Gauge size={19} strokeWidth={1.9} color="var(--brass-600)" />} label="Best ATS score" value="92" suffix="/100" tone="gold" />
        <StatTile icon={<FolderOpen size={19} strokeWidth={1.9} color="var(--ink-600)" />} label="Portfolio items" value="11" tone="blue" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 22 }}>
        {/* recent resumes */}
        <Card variant="raised" padding="0">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--line-200)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)" }}>Recent resumes</span>
            <button onClick={() => navigate("/resumes")} style={{ border: "none", background: "transparent", color: "var(--ink-600)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              View all →
            </button>
          </div>

          {vList.length === 0 ? (
            <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--slate-500)", fontFamily: "var(--font-body)" }}>
              No resumes yet. <button onClick={() => navigate("/generate")} style={{ border: "none", background: "transparent", color: "var(--ink-600)", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 600 }}>Craft your first →</button>
            </div>
          ) : (
            vList.slice(0, 3).map((r, i) => (
              <div key={r.id} onClick={() => navigate(`/resumes/${r.id}`)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: i < Math.min(vList.length, 3) - 1 ? "1px solid var(--line-200)" : "none", cursor: "pointer" }}>
                <span style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--paper-200)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} strokeWidth={1.9} color="var(--ink-700)" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{r.version_label}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>{r.role} · {r.updated}</div>
                </div>
                <StatusBadge status={r.status} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--brass-800)", width: 40, textAlign: "right" }}>{r.ats_score}</span>
              </div>
            ))
          )}
        </Card>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Card variant="seal" padding="22px">
            <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 12 }}>Profile completeness</div>
            <ProgressMeter value={pct} label="Portfolio strength" />
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-700)", marginTop: 12, lineHeight: 1.5 }}>
              {completeness?.message || `Add more projects to reach a full signature.`}
            </div>
            <div style={{ marginTop: 14 }}>
              <Button variant="secondary" size="sm" block onClick={() => navigate("/portfolio")}>Open portfolio</Button>
            </div>
          </Card>

          <Card variant="raised" padding="22px">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Compass size={17} strokeWidth={1.9} color="var(--ink-600)" />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>Gap Advisor</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-700)", margin: "0 0 14px", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--danger-600)" }}>2 high-priority skills</strong> stand between you and Staff Engineer.
            </p>
            <Button variant="ghost" size="sm" onClick={() => navigate("/gap")} iconRight={<ArrowRight size={14} strokeWidth={1.9} />}>
              See your path
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
