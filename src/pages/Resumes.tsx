import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Copy, Trash2, Pencil, Archive, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/data-display/Card";
import { Badge } from "@/components/data-display/Badge";
import { Button } from "@/components/core/Button";
import { ProgressMeter } from "@/components/data-display/ProgressMeter";
import { Seal } from "@/components/brand/Seal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";
import { ResumeTemplateThumbnail, getResumeTemplateLabel } from "@/lib/resumeTemplates";

interface ResumeVersion {
  id: string;
  version_label: string;
  template_id?: string;
  page_length?: string;
  status: "draft" | "submitted" | "archived";
  ats_score: number;
  updated_at: string;
  updated?: string;
  role?: string;
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
  const { data: versions, loading, setData } = useApi<ResumeVersion[]>(EP.resumes);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const vList: ResumeVersion[] = versions || [];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this resume version? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(EP.resume(id));
      setData(vList.filter((v) => v.id !== id));
      showToast("Resume deleted.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const r = await api.post<ResumeVersion>(`${EP.resume(id)}/duplicate`);
      setData([r.data, ...vList]);
      showToast("Resume duplicated.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Duplicate failed.");
    }
  };

  const handleArchive = async (e: React.MouseEvent, r: ResumeVersion) => {
    e.stopPropagation();
    const newStatus = r.status === "archived" ? "draft" : "archived";
    try {
      await api.patch(`${EP.resume(r.id)}/status`, { status: newStatus });
      setData(vList.map((v) => v.id === r.id ? { ...v, status: newStatus } : v));
      showToast(newStatus === "archived" ? "Archived." : "Restored to draft.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const handleDownload = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const r = await api.get<{ url: string }>(EP.resumeExport(id));
      window.open(r.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "PDF download failed.");
    }
  };

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="Your library"
        title="Resumes"
        subtitle="Review, duplicate, archive, and export every generated resume version."
      >
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
              <div style={{ height: 146, background: "linear-gradient(150deg, var(--paper-200), var(--paper-300))", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--line-200)", position: "relative", padding: 18 }}>
                <div style={{ width: 142, transform: "scale(1.04)" }}>
                  <ResumeTemplateThumbnail templateId={r.template_id || "primary"} />
                </div>
                <span style={{ position: "absolute", top: 12, right: 12 }}><StatusBadge status={r.status} /></span>
                <span style={{ position: "absolute", top: 12, left: 12, fontFamily: "var(--font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--slate-500)" }}>
                  {getResumeTemplateLabel(r.template_id)} · {r.page_length || "1-page"}
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.version_label}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", margin: "2px 0 14px" }}>{r.role || "Resume"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)", flexShrink: 0 }}>ATS</span>
                  <div style={{ flex: 1 }}><ProgressMeter value={Number(r.ats_score) || 0} height={7} showValue={false} /></div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--brass-800)" }}>{r.ats_score ? Math.round(Number(r.ats_score)) : "—"}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  <Button variant="secondary" size="sm" iconLeft={<Pencil size={13} strokeWidth={1.9} />} onClick={(e) => { e.stopPropagation(); navigate(`/resumes/${r.id}`); }}>Open</Button>
                  <button
                    onClick={(e) => handleDownload(e, r.id)}
                    title="Download PDF"
                    style={iconBtn}
                  >
                    <Download size={15} strokeWidth={1.9} />
                  </button>
                  <button
                    onClick={(e) => handleDuplicate(e, r.id)}
                    title="Duplicate"
                    style={iconBtn}
                  >
                    <Copy size={15} strokeWidth={1.9} />
                  </button>
                  <button
                    onClick={(e) => handleArchive(e, r)}
                    title={r.status === "archived" ? "Restore" : "Archive"}
                    style={{ ...iconBtn, color: r.status === "archived" ? "var(--brass-600)" : "var(--slate-500)" }}
                  >
                    <Archive size={15} strokeWidth={1.9} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, r.id)}
                    title="Delete"
                    disabled={deletingId === r.id}
                    style={{ ...iconBtn, color: "var(--danger-500)", marginLeft: "auto" }}
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "var(--ink-900)", color: "var(--paper-50)",
          fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500,
          padding: "12px 18px", borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)", zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </PageContainer>
  );
}
