import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Copy, Archive, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { ProgressMeter } from "@/components/data-display/ProgressMeter";
import { Seal } from "@/components/brand/Seal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";

interface ResumeVersion {
  id: string;
  version_label: string;
  template_id?: string;
  page_length?: string;
  status: "draft" | "submitted" | "archived";
  ats_score: number;
  updated: string;
  role: string;
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

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center",
  border: "1.5px solid var(--line-300)", background: "transparent", borderRadius: "var(--radius-sm)",
  color: "var(--slate-500)", cursor: "pointer",
};

export function ResumesPage() {
  const navigate = useNavigate();
  const { data: versions, loading } = useApi<ResumeVersion[]>(EP.resumes);

  const vList: ResumeVersion[] = versions || [];

  return (
    <div style={{ maxWidth: 1040 }}>
      <PageHeader overline="Your library" title="Resumes">
        <Button variant="gold" iconLeft={<Sparkles size={16} strokeWidth={1.9} />} onClick={() => navigate("/generate")}>
          Craft a resume
        </Button>
      </PageHeader>

      {!loading && vList.length === 0 ? (
        <Card variant="seal" padding="0" style={{ textAlign: "center" }}>
          <EmptyState
            title="Your first resume is waiting to be signed."
            body="Craft a tailored resume from your portfolio in under two minutes."
            action={
              <Button variant="gold" iconLeft={<Sparkles size={16} strokeWidth={1.9} />} onClick={() => navigate("/generate")}>
                Craft a resume
              </Button>
            }
          />
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 32 }}>
            <Seal size={120} rotate={-5} />
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
          {vList.map((r) => (
            <Card key={r.id} variant="raised" interactive onClick={() => navigate(`/resumes/${r.id}`)} padding="0">
              <div style={{ height: 130, background: "linear-gradient(150deg, var(--paper-200), var(--paper-300))", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--line-200)", position: "relative" }}>
                <Seal size={80} rotate={-5} />
                <span style={{ position: "absolute", top: 12, right: 12 }}><StatusBadge status={r.status} /></span>
                <span style={{ position: "absolute", top: 12, left: 12, fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--slate-500)" }}>
                  {r.template_id || "modern"} · {r.page_length || "1-page"}
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)" }}>{r.version_label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", margin: "2px 0 14px" }}>{r.role}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", flexShrink: 0 }}>ATS</span>
                  <div style={{ flex: 1 }}><ProgressMeter value={r.ats_score} height={7} showValue={false} /></div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--brass-800)" }}>{r.ats_score}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  <Button variant="secondary" size="sm" iconLeft={<Pencil size={13} strokeWidth={1.9} />} onClick={(e) => { e.stopPropagation(); navigate(`/resumes/${r.id}`); }}>Open</Button>
                  <button onClick={(e) => e.stopPropagation()} title="Duplicate" style={iconBtn}><Copy size={15} strokeWidth={1.9} /></button>
                  <button onClick={(e) => e.stopPropagation()} title="Archive" style={iconBtn}><Archive size={15} strokeWidth={1.9} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
