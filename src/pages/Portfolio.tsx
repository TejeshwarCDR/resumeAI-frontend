import React, { useState } from "react";
import { Pencil, Trash2, WandSparkles, UploadCloud, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/data-display/Card";
import { Tabs } from "@/components/navigation/Tabs";
import { Button } from "@/components/core/Button";
import { Tag } from "@/components/data-display/Tag";
import { Badge } from "@/components/data-display/Badge";
import { Input } from "@/components/forms/Input";
import { Textarea } from "@/components/forms/Textarea";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";

const TABS = [
  { id: "experience",     label: "Experience" },
  { id: "projects",       label: "Projects" },
  { id: "education",      label: "Education" },
  { id: "skills",         label: "Skills" },
  { id: "certifications", label: "Certifications" },
];

const MOCK_EXP = [
  { id: "e1", icon: "briefcase", title: "Software Engineer · Babbage Labs", meta: "Full-time · London · 2023 — Present", desc: "Shipped the notation engine still used by 200k authors today.", tags: ["200k active authors"], tagTone: "gold" as const, current: true },
  { id: "e2", icon: "briefcase", title: "Engineering Intern · Analytical Engines Co.", meta: "Internship · Remote · 2022", desc: "Built internal tooling that cut deploy time across 12 services.", tags: [], tagTone: "blue" as const, current: false },
];
const MOCK_PROJ = [
  { id: "p1", icon: "folder-git-2", title: "Lovelace Notation Engine", meta: "Developer Tools · github.com/ada/notation", desc: "6× faster parsing", tags: ["TypeScript", "Rust", "WASM"], tagTone: "blue" as const },
  { id: "p2", icon: "folder-git-2", title: "Threads — distributed queue", meta: "Infrastructure", desc: "99.99% delivery", tags: ["Go", "PostgreSQL", "gRPC"], tagTone: "blue" as const },
];
const MOCK_EDU = [
  { id: "ed1", icon: "graduation-cap", title: "BSc Computer Science · University of London", meta: "First Class · 2021 — 2025", desc: "Dean's List ×3", tags: ["First Class"], tagTone: "gold" as const },
];
const MOCK_CERTS = [
  { id: "c1", icon: "award", title: "AWS Solutions Architect — Associate", meta: "Amazon Web Services · expires 2027", desc: "", tags: [], tagTone: "blue" as const },
];

interface PortfolioItem {
  id: string;
  title: string;
  meta: string;
  desc?: string;
  tags: string[];
  tagTone: "blue" | "gold" | "neutral";
  current?: boolean;
}

function ItemCard({ item, onEdit, onDelete }: { item: PortfolioItem; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <Card padding="18px 20px" interactive>
      <div style={{ display: "flex", gap: 16 }}>
        <span style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "var(--ink-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "var(--ink-700)" }}>◈</span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{item.title}</span>
            {item.current && <Badge tone="success" dot>Current</Badge>}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)", marginTop: 2 }}>{item.meta}</div>
          {item.desc && <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--slate-700)", margin: "8px 0 0", lineHeight: 1.5 }}>{item.desc}</p>}
          {item.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {item.tags.map((t) => <Tag key={t} tone={item.tagTone}>{t}</Tag>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)", height: 24 }}>
            <Pencil size={16} strokeWidth={1.9} />
          </button>
          <button onClick={onDelete} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)", height: 24 }}>
            <Trash2 size={16} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export function PortfolioPage() {
  const [tab, setTab] = useState("experience");
  const [skills, setSkills] = useState(["Systems Design", "TypeScript", "Rust", "Distributed Data", "Go", "Mentorship", "Technical Writing"]);
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      api.post(EP.portfolio, { type: "skills", name: skillInput.trim() }).catch(() => {});
      setSkillInput("");
    }
  };

  const renderItems = (items: PortfolioItem[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
      <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "transparent", border: "1.5px dashed var(--line-300)", borderRadius: "var(--radius-md)", color: "var(--ink-600)", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        <Plus size={16} strokeWidth={1.9} /> Add item
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader overline="Your portfolio" title="Everything you are">
        <Button variant="secondary" iconLeft={<UploadCloud size={16} strokeWidth={1.9} />}>Import document</Button>
        <Button variant="primary" iconLeft={<Plus size={16} strokeWidth={1.9} />}>Add item</Button>
      </PageHeader>

      <Card variant="seal" padding="16px 20px" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <WandSparkles size={22} strokeWidth={1.9} color="var(--brass-600)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>Drop in a resume and we'll do the typing</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>We extract experience, projects, skills and education from PDF or DOCX.</div>
          </div>
          <Button variant="gold" size="sm">Upload</Button>
        </div>
      </Card>

      <Tabs items={TABS} value={tab} onChange={setTab} style={{ marginBottom: 22 }} />

      {tab === "experience" && renderItems(MOCK_EXP)}
      {tab === "projects" && renderItems(MOCK_PROJ)}
      {tab === "education" && renderItems(MOCK_EDU)}
      {tab === "certifications" && renderItems(MOCK_CERTS)}

      {tab === "skills" && (
        <Card padding="22px">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 16 }}>
            {skills.map((s) => (
              <Tag key={s} tone="blue" onRemove={() => setSkills(skills.filter((x) => x !== s))}>{s}</Tag>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              placeholder="Add a skill…"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              style={{ flex: 1 }}
            />
            <Button variant="secondary" onClick={addSkill}>Add</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
