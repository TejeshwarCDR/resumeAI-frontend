import React, { useEffect, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/data-display/Card";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";
import { EmptyState } from "@/components/feedback/EmptyState";
import { api } from "@/lib/api";
import { EP } from "@/lib/endpoints";

const STATUSES = ["saved", "preparing", "applied", "interview", "offer", "rejected", "withdrawn"];

interface Application {
  id: string;
  company: string;
  role: string;
  source_url?: string | null;
  status: string;
  application_date?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
}

export function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    api.get<Application[]>(`${EP.applications}${status ? `?status=${status}` : ""}`)
      .then((response) => setItems(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load applications."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company.trim() || !role.trim()) return;
    await api.post(EP.applications, {
      company: company.trim(),
      role: role.trim(),
      source_url: sourceUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "saved",
    });
    setCompany("");
    setRole("");
    setSourceUrl("");
    setNotes("");
    setShowCreate(false);
    load();
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    await api.patch(EP.application(id), { status: nextStatus });
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
  };

  return (
    <PageContainer variant="wide">
      <PageHeader
        overline="Applications"
        title="Track your job search"
        subtitle="Keep target roles, follow-ups, notes, and application status aligned with your resume workflow."
      />

      <div className="sig-toolbar">
        <Select
          label="Filter by status"
          options={["", ...STATUSES]}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ maxWidth: 240 }}
        />
        <Button iconLeft={<Plus size={16} strokeWidth={1.9} />} onClick={() => setShowCreate((value) => !value)}>
          New application
        </Button>
      </div>

      {showCreate && (
        <Card padding="22px" style={{ marginBottom: 18 }}>
          <form onSubmit={create} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Company" value={company} onChange={(event) => setCompany(event.target.value)} required />
            <Input label="Role" value={role} onChange={(event) => setRole(event.target.value)} required />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Source URL" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Textarea label="Notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Save application</Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <p style={{ fontFamily: "var(--font-body)", color: "var(--slate-500)" }}>Loading applications…</p>}
      {error && <p style={{ fontFamily: "var(--font-body)", color: "var(--danger-600, #dc2626)" }}>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No applications yet"
          body="Save roles you are preparing for, then link generated resumes as you apply."
        />
      )}

      <div className="sig-card-grid">
        {items.map((item) => (
          <Card key={item.id} padding="18px 20px">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>
                  {item.role} · {item.company}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 3 }}>
                  {item.application_date ? `Applied ${new Date(item.application_date).toLocaleDateString()}` : "Not applied yet"}
                  {item.follow_up_date ? ` · Follow up ${new Date(item.follow_up_date).toLocaleDateString()}` : ""}
                </div>
                {item.notes && (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", lineHeight: 1.5, margin: "8px 0 0" }}>
                    {item.notes}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.source_url && (
                  <a href={item.source_url} target="_blank" rel="noreferrer" title="Open source" style={{ color: "var(--slate-500)", lineHeight: 0 }}>
                    <ExternalLink size={16} strokeWidth={1.9} />
                  </a>
                )}
                <select
                  value={item.status}
                  onChange={(event) => void updateStatus(item.id, event.target.value)}
                  style={{
                    height: 34,
                    border: "1.5px solid var(--line-300)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--paper-50)",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                  }}
                >
                  {STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
