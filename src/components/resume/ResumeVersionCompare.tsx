import React, { useState } from "react";
import { X, Plus, Minus, Equal } from "lucide-react";
import type { ParsedResumeData } from "./ResumeReviewModal";

interface ResumeVersion {
  id: string;
  filename: string;
  uploadedAt: string;
  parsedData: ParsedResumeData;
}

interface ResumeVersionCompareProps {
  versions: [ResumeVersion, ResumeVersion];
  onClose: () => void;
}

type DiffStatus = "added" | "removed" | "unchanged";

interface DiffItem {
  label: string;
  status: DiffStatus;
}

// ── Diff helpers ──────────────────────────────────────────────────────────────

function diffSets(oldSet: Set<string>, newSet: Set<string>): DiffItem[] {
  const all = new Set([...oldSet, ...newSet]);
  return [...all].map((item) => {
    const status: DiffStatus = oldSet.has(item) && newSet.has(item)
      ? "unchanged"
      : newSet.has(item)
        ? "added"
        : "removed";
    return { label: item, status };
  }).sort((a, b) => {
    const order: Record<DiffStatus, number> = { added: 0, unchanged: 1, removed: 2 };
    return order[a.status] - order[b.status];
  });
}

function normTitle(s: string) {
  return s.toLowerCase().trim();
}

function diffTitledLists(
  oldItems: { title: string }[],
  newItems: { title: string }[],
): DiffItem[] {
  const oldTitles = new Set(oldItems.map((i) => normTitle(i.title)));
  const newTitles = new Set(newItems.map((i) => normTitle(i.title)));

  const results: DiffItem[] = [];

  for (const item of newItems) {
    results.push({
      label: item.title,
      status: oldTitles.has(normTitle(item.title)) ? "unchanged" : "added",
    });
  }
  for (const item of oldItems) {
    if (!newTitles.has(normTitle(item.title))) {
      results.push({ label: item.title, status: "removed" });
    }
  }

  return results.sort((a, b) => {
    const order: Record<DiffStatus, number> = { added: 0, unchanged: 1, removed: 2 };
    return order[a.status] - order[b.status];
  });
}

// ── Display helpers ───────────────────────────────────────────────────────────

const STATUS_STYLE: Record<DiffStatus, React.CSSProperties> = {
  added: {
    background: "var(--success-100, #dcfce7)",
    color: "var(--success-700, #15803d)",
    borderLeft: "3px solid var(--success-500, #22c55e)",
  },
  removed: {
    background: "var(--danger-100, #fee2e2)",
    color: "var(--danger-700, #b91c1c)",
    borderLeft: "3px solid var(--danger-400, #f87171)",
    textDecoration: "line-through",
    opacity: 0.8,
  },
  unchanged: {
    background: "var(--paper-100, #f5f4ef)",
    color: "var(--slate-700)",
    borderLeft: "3px solid var(--line-300, #ddd)",
  },
};

const StatusIcon = ({ status }: { status: DiffStatus }) => {
  if (status === "added") return <Plus size={11} strokeWidth={2.5} />;
  if (status === "removed") return <Minus size={11} strokeWidth={2.5} />;
  return <Equal size={11} strokeWidth={2} style={{ color: "var(--slate-400)" }} />;
};

function DiffBadge({ status }: { status: DiffStatus }) {
  const labels = { added: "New", removed: "Removed", unchanged: "Same" };
  const colors = {
    added:    { bg: "var(--success-200)", color: "var(--success-700)" },
    removed:  { bg: "var(--danger-200)", color: "var(--danger-700)" },
    unchanged: { bg: "var(--paper-300)", color: "var(--slate-500)" },
  };
  const c = colors[status];
  return (
    <span style={{
      padding: "1px 7px", borderRadius: "var(--radius-full)",
      fontSize: 10, fontWeight: 700, fontFamily: "var(--font-body)",
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: c.bg, color: c.color,
    }}>
      {labels[status]}
    </span>
  );
}

function DiffList({ items, emptyLabel }: { items: DiffItem[]; emptyLabel: string }) {
  if (!items.length) {
    return <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)", padding: "10px 0" }}>{emptyLabel}</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          ...STATUS_STYLE[item.status],
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
          fontFamily: "var(--font-body)", fontSize: 13.5,
        }}>
          <StatusIcon status={item.status} />
          <span style={{ flex: 1 }}>{item.label}</span>
          <DiffBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}

function SkillDiffChips({ items }: { items: DiffItem[] }) {
  if (!items.length) {
    return <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-400)" }}>No skills found.</div>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {items.map((item, i) => (
        <span key={i} style={{
          padding: "4px 12px", borderRadius: "var(--radius-full)",
          fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: item.status !== "unchanged" ? 700 : 500,
          ...STATUS_STYLE[item.status],
          textDecoration: item.status === "removed" ? "line-through" : "none",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <StatusIcon status={item.status} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--slate-500)" }}>
      {[
        { status: "added" as DiffStatus, label: "Added in newer version" },
        { status: "removed" as DiffStatus, label: "Removed from newer version" },
        { status: "unchanged" as DiffStatus, label: "Present in both" },
      ].map(({ status, label }) => (
        <span key={status} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_STYLE[status].background as string, display: "inline-block" }} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children, added, removed }: { title: string; children: React.ReactNode; added: number; removed: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--slate-500)" }}>
          {title}
        </div>
        {added > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)", color: "var(--success-700)", background: "var(--success-100)", padding: "1px 7px", borderRadius: "var(--radius-full)", letterSpacing: "0.04em" }}>
            +{added} new
          </span>
        )}
        {removed > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)", color: "var(--danger-700)", background: "var(--danger-100)", padding: "1px 7px", borderRadius: "var(--radius-full)", letterSpacing: "0.04em" }}>
            -{removed} removed
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type SectionId = "experience" | "education" | "skills" | "projects" | "certifications";

const SECTION_TABS: { id: SectionId; label: string }[] = [
  { id: "experience",     label: "Experience"    },
  { id: "education",      label: "Education"     },
  { id: "skills",         label: "Skills"        },
  { id: "projects",       label: "Projects"      },
  { id: "certifications", label: "Certifications"},
];

export function ResumeVersionCompare({ versions, onClose }: ResumeVersionCompareProps) {
  const [older, newer] = versions;
  const [activeSection, setActiveSection] = useState<SectionId>("experience");

  const o = older.parsedData;
  const n = newer.parsedData;

  const diffs: Record<SectionId, DiffItem[]> = {
    experience:     diffTitledLists(o.experience ?? [], n.experience ?? []),
    education:      diffTitledLists(o.education ?? [], n.education ?? []),
    skills:         diffSets(
                      new Set((o.skills ?? []).map((s) => s.title)),
                      new Set((n.skills ?? []).map((s) => s.title)),
                    ),
    projects:       diffTitledLists(o.projects ?? [], n.projects ?? []),
    certifications: diffTitledLists(o.certifications ?? [], n.certifications ?? []),
  };

  const countFor = (section: SectionId, status: DiffStatus) =>
    diffs[section].filter((d) => d.status === status).length;

  const totalAdded   = Object.keys(diffs).reduce((sum, k) => sum + countFor(k as SectionId, "added"), 0);
  const totalRemoved = Object.keys(diffs).reduce((sum, k) => sum + countFor(k as SectionId, "removed"), 0);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101, padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 720, background: "var(--paper-50)", borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid var(--line-300)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brass-700)", marginBottom: 4 }}>
                Version comparison
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>
                What changed between these versions?
              </h2>
              <div style={{ display: "flex", gap: 10, marginTop: 8, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--slate-500)" }}>
                <span style={{ padding: "2px 10px", background: "var(--danger-100)", color: "var(--danger-700)", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                  Older: {older.filename}
                </span>
                <span style={{ padding: "2px 10px", background: "var(--success-100)", color: "var(--success-700)", borderRadius: "var(--radius-full)", fontWeight: 600 }}>
                  Newer: {newer.filename}
                </span>
              </div>
              {(totalAdded > 0 || totalRemoved > 0) && (
                <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 13, color: "var(--slate-600)" }}>
                  {totalAdded > 0 && <span style={{ color: "var(--success-700)", fontWeight: 700 }}>{totalAdded} item{totalAdded !== 1 ? "s" : ""} added </span>}
                  {totalAdded > 0 && totalRemoved > 0 && " · "}
                  {totalRemoved > 0 && <span style={{ color: "var(--danger-700)", fontWeight: 700 }}>{totalRemoved} removed</span>}
                  {totalAdded === 0 && totalRemoved === 0 && <span style={{ color: "var(--slate-400)" }}>No differences found — resumes appear identical.</span>}
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--slate-400)", padding: 4, flexShrink: 0 }}>
              <X size={20} strokeWidth={1.9} />
            </button>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
            {SECTION_TABS.map((tab) => {
              const active = activeSection === tab.id;
              const added = countFor(tab.id, "added");
              const removed = countFor(tab.id, "removed");
              return (
                <button key={tab.id} type="button" onClick={() => setActiveSection(tab.id)} style={{
                  padding: "9px 14px", fontFamily: "var(--font-body)", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink-900)" : "var(--slate-500)",
                  background: "transparent", border: "none",
                  borderBottom: active ? "2.5px solid var(--ink-600)" : "2.5px solid transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "color 0.12s", whiteSpace: "nowrap",
                }}>
                  {tab.label}
                  {(added > 0 || removed > 0) && (
                    <span style={{ display: "flex", gap: 3 }}>
                      {added > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "0 5px", borderRadius: "var(--radius-full)", background: "var(--success-200)", color: "var(--success-700)" }}>+{added}</span>}
                      {removed > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "0 5px", borderRadius: "var(--radius-full)", background: "var(--danger-200)", color: "var(--danger-700)" }}>-{removed}</span>}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          <Legend />
          <div style={{ marginTop: 18 }}>
            {activeSection === "skills" ? (
              <Section
                title="Skills"
                added={countFor("skills", "added")}
                removed={countFor("skills", "removed")}
              >
                <SkillDiffChips items={diffs.skills} />
              </Section>
            ) : (
              <Section
                title={SECTION_TABS.find((t) => t.id === activeSection)?.label ?? ""}
                added={countFor(activeSection, "added")}
                removed={countFor(activeSection, "removed")}
              >
                <DiffList
                  items={diffs[activeSection]}
                  emptyLabel={`No ${activeSection} found in either version.`}
                />
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 28px", borderTop: "1px solid var(--line-300)", background: "var(--paper-100)",
          display: "flex", justifyContent: "flex-end",
        }}>
          <button type="button" onClick={onClose} style={{
            padding: "8px 20px", fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 600,
            background: "var(--ink-900)", color: "var(--paper-50)",
            border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
