import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft, Save, Download, Plus, Trash2, ChevronUp, ChevronDown,
  Check, AlertCircle, RefreshCw, Layers,
} from "lucide-react";
import { Button } from "@/components/core/Button";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { FontSize } from "@/lib/tiptap/fontSize";
import {
  generatedContentToHtml,
  extractSections,
  reconstructHtml,
  buildPdfDocument,
  type ResumeSection,
} from "@/lib/tiptap/converter";
import { useApi } from "@/lib/hooks/useApi";
import { EP } from "@/lib/endpoints";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedContent {
  summary?: string;
  experience?: Array<{ company?: string; role?: string; period?: string; bullets?: string[] }>;
  projects?: Array<{ name?: string; description?: string; tech_stack?: string[]; bullets?: string[] }>;
  researchPapers?: Array<{ title?: string; authors?: string[]; venue?: string; year?: string; doi?: string; arxivUrl?: string; publicationUrl?: string; githubUrl?: string; description?: string; keywords?: string[]; status?: string }>;
  skills?: unknown;
  education?: Array<{ institution?: string; degree?: string; period?: string; gpa?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
}

interface ResumeVersion {
  id: string;
  version_label: string;
  status: string;
  job_title?: string;
  company_name?: string;
  template_id: string;
  generated_content?: GeneratedContent;
  editor_html?: string | null;
  pdf_signed_url?: string;
}

const TEMPLATES = [
  { id: "academic", label: "Academic Serif" },
  { id: "classic",  label: "Classic" },
  { id: "modern",   label: "Modern" },
  { id: "elegant",  label: "Elegant" },
  { id: "compact",  label: "Compact" },
];

// ─── Editor CSS ───────────────────────────────────────────────────────────────

const EDITOR_CSS = `
.ProseMirror-focused { outline: none; }
.resume-canvas .ProseMirror {
  min-height: 1027px;
  padding: 48px 56px 44px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px;
  color: #1a1a1a;
  line-height: 1.5;
  caret-color: #1a1a1a;
}
.resume-canvas.template-academic .ProseMirror {
  min-height: 1123px;
  padding: 40px 40px 48px;
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  overflow-wrap: break-word;
  hyphens: auto;
}
.resume-canvas.template-academic .ProseMirror h1 {
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 25pt;
  font-weight: 400;
  text-align: center;
  color: #111;
  border-bottom: 0;
  padding-bottom: 0;
  margin: 0 0 5px;
  line-height: 1.08;
  letter-spacing: 0;
}
.resume-canvas.template-academic .ProseMirror h1 + p,
.resume-canvas.template-academic .ProseMirror h1 + p + p {
  text-align: center;
  font-size: 12pt;
  color: #111;
  margin: 0 0 4px;
  line-height: 1.2;
}
.resume-canvas.template-academic .ProseMirror h1 + p + p { margin-bottom: 18px; }
.resume-canvas.template-academic .ProseMirror h2 {
  font-family: "CMU Serif", "Latin Modern Roman", "Computer Modern", "Times New Roman", Georgia, serif;
  font-size: 17.5pt;
  font-weight: 500;
  font-variant: small-caps;
  text-transform: uppercase;
  letter-spacing: 0;
  color: #111;
  border-bottom: 1px solid #222;
  padding-bottom: 2px;
  margin: 18px 0 10px;
  line-height: 1.05;
  break-after: avoid;
  page-break-after: avoid;
}
.resume-canvas.template-academic .ProseMirror p {
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  margin-bottom: 5px;
}
.resume-canvas.template-academic .ProseMirror ul,
.resume-canvas.template-academic .ProseMirror ol {
  padding-left: 18pt;
  margin: 4px 0 8px;
}
.resume-canvas.template-academic .ProseMirror li {
  font-size: 12pt;
  line-height: 1.2;
  color: #111;
  margin-bottom: 2px;
  padding-left: 2px;
}
.resume-canvas.template-academic .ProseMirror a {
  color: #003399;
  text-decoration: none;
}
.resume-canvas.template-academic .ProseMirror strong { font-weight: 700; }
.resume-canvas.template-academic .ProseMirror em { font-style: italic; color: #111; }
.resume-canvas.template-modern .ProseMirror h1 {
  font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
  font-size: 22px; font-weight: 700; color: #111;
  border-bottom: 3px solid #b8963e; padding-bottom: 8px; margin-bottom: 4px;
}
.resume-canvas.template-modern .ProseMirror h2 {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.15em; color: #b8963e;
  border-bottom: 1px solid #e8d8b0; padding-bottom: 3px; margin: 14px 0 6px;
}
.resume-canvas.template-elegant .ProseMirror h1 {
  font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #111;
  border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 5px; letter-spacing: -0.5px;
}
.resume-canvas.template-elegant .ProseMirror h2 {
  font-family: Georgia, serif; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: #333;
  border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 16px 0 7px;
}
.resume-canvas.template-compact .ProseMirror {
  font-size: 10px;
  padding: 32px 40px 28px;
}
.resume-canvas.template-compact .ProseMirror h1 {
  font-size: 18px; margin-bottom: 3px;
}
.resume-canvas.template-compact .ProseMirror h2 {
  font-size: 8px; margin: 10px 0 5px;
}
/* Default (classic) */
.resume-canvas .ProseMirror h1 {
  font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #111;
  border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 5px; letter-spacing: -0.3px;
}
.resume-canvas .ProseMirror h2 {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.15em; color: #555;
  border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 14px 0 6px;
}
.resume-canvas .ProseMirror h3 { font-size: 11px; font-weight: 700; color: #222; margin: 8px 0 3px; }
.resume-canvas .ProseMirror p { font-size: 11px; line-height: 1.5; color: #333; margin-bottom: 2px; }
.resume-canvas .ProseMirror ul { padding-left: 16px; margin: 3px 0; }
.resume-canvas .ProseMirror ol { padding-left: 16px; margin: 3px 0; }
.resume-canvas .ProseMirror li { font-size: 10.5px; line-height: 1.45; color: #333; margin-bottom: 1.5px; }
.resume-canvas .ProseMirror a { color: #1d4ed8; text-decoration: underline; }
.resume-canvas .ProseMirror strong { font-weight: 700; }
.resume-canvas .ProseMirror em { font-style: italic; color: #555; }
.resume-canvas .ProseMirror .is-empty::before {
  content: attr(data-placeholder); color: #ccc; pointer-events: none; float: left; height: 0;
}
`;

// ─── Page break overlay ────────────────────────────────────────────────────────

function PageLines({ contentHeight }: { contentHeight: number }) {
  const A4_H = 1027 + 48 + 44; // content + paddings ≈ 1119px
  const pages = Math.max(1, Math.ceil(contentHeight / A4_H));
  return (
    <>
      {Array.from({ length: pages - 1 }, (_, i) => (
        <div key={i} style={{
          position: "absolute", left: 0, right: 0, top: (i + 1) * A4_H,
          height: 24, background: "#e8e8e8",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1, pointerEvents: "none",
        }}>
          <div style={{ width: "100%", borderTop: "1px dashed #bbb" }} />
          <span style={{ position: "absolute", background: "#e8e8e8", padding: "0 10px", fontSize: 10, color: "#aaa", whiteSpace: "nowrap" }}>
            Page {i + 2}
          </span>
        </div>
      ))}
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "success" | "error" | "info" }) {
  const bg = type === "error" ? "#dc2626" : type === "info" ? "#1d4ed8" : "#111";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: bg, color: "#fff", borderRadius: 8,
      padding: "11px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      fontFamily: "var(--font-body)", fontSize: 13.5, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 8, maxWidth: 380,
    }}>
      {type === "success" ? <Check size={15} strokeWidth={2} /> : <AlertCircle size={15} strokeWidth={2} />}
      {msg}
    </div>
  );
}

// ─── Sections Sidebar Panel ───────────────────────────────────────────────────

function SectionsPanel({
  sections, onMove, onDelete, onAdd,
}: {
  sections: ResumeSection[];
  onMove: (from: number, to: number) => void;
  onDelete: (idx: number) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-500)" }}>Sections</span>
        <button
          type="button"
          onClick={onAdd}
          style={{ display: "flex", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", color: "var(--brass-600)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600 }}
        >
          <Plus size={12} strokeWidth={2} /> Add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {sections.map((sec, i) => (
          <div key={sec.id} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 8px", borderRadius: 6,
            background: "var(--paper-100)", border: "1px solid var(--line-200)",
          }}>
            <Layers size={12} strokeWidth={1.9} color="var(--slate-400)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sec.title}
            </span>
            <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onMove(i, i - 1)}
                disabled={i === 0}
                style={{ border: "none", background: "transparent", cursor: i === 0 ? "default" : "pointer", color: "var(--slate-400)", opacity: i === 0 ? 0.3 : 1, padding: 1 }}
                title="Move up"
              >
                <ChevronUp size={12} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => onMove(i, i + 1)}
                disabled={i === sections.length - 1}
                style={{ border: "none", background: "transparent", cursor: i === sections.length - 1 ? "default" : "pointer", color: "var(--slate-400)", opacity: i === sections.length - 1 ? 0.3 : 1, padding: 1 }}
                title="Move down"
              >
                <ChevronDown size={12} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete section "${sec.title}"? This cannot be undone.`)) onDelete(i);
                }}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#f87171", padding: 1 }}
                title="Delete section"
              >
                <Trash2 size={11} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ResumeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: resume, loading } = useApi<ResumeVersion>(id ? EP.resume(id) : "");
  const [template, setTemplate] = useState("academic");
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [headerHtml, setHeaderHtml] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [contentHeight, setContentHeight] = useState(1120);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Initialize TipTap ────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize as never,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: "Start typing your resume content here…",
        emptyEditorClass: "is-empty",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // Measure content height for page break indicators
      const el = editorRef.current?.querySelector(".ProseMirror") as HTMLElement;
      if (el) setContentHeight(el.scrollHeight);

      // Sync sections sidebar
      const html = editor.getHTML();
      const { header, sections: secs } = extractSections(html);
      setHeaderHtml(header);
      setSections(secs);

      // Schedule auto-save
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave(editor.getHTML());
      }, 3000);
    },
  });

  // ── Load initial content ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editor || !resume || isInitialized.current) return;
    isInitialized.current = true;

    // Set template from DB
    if (resume.template_id) setTemplate(resume.template_id);

    // Load saved editor HTML first, else convert generated_content
    const loadEditorContent = async () => {
      try {
        const r = await api.get<{ editor_html: string | null }>(EP.resumeEditor(id!));
        if (r.data.editor_html) {
          editor.commands.setContent(r.data.editor_html);
          return;
        }
      } catch {
        // No saved editor content, fall through to generated_content
      }

      if (resume.generated_content) {
        const html = generatedContentToHtml(resume.generated_content, user);
        editor.commands.setContent(html);
      }
    };

    loadEditorContent();
  }, [editor, resume, id, user]);

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const autoSave = useCallback(
    async (html: string) => {
      if (!id) return;
      setSaveStatus("saving");
      try {
        await api.patch(EP.resumeEditor(id), { html });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("error");
      }
    },
    [id],
  );

  // ── Manual save ───────────────────────────────────────────────────────────
  const saveNow = async () => {
    if (!editor || !id) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await autoSave(editor.getHTML());
    showToast("Changes saved.", "success");
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const exportPdf = async () => {
    if (!editor || !id) return;
    setExporting(true);
    try {
      const bodyHtml = editor.getHTML();
      const completeHtml = buildPdfDocument(bodyHtml, template);
      const r = await api.post<{ url: string }>(EP.resumeRenderPdf(id), { html: completeHtml });
      window.open(r.data.url, "_blank");
      showToast("PDF ready — opened in new tab.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Section management ────────────────────────────────────────────────────
  const moveSectionInEditor = (from: number, to: number) => {
    if (!editor) return;
    if (to < 0 || to >= sections.length) return;
    const newSecs = [...sections];
    [newSecs[from], newSecs[to]] = [newSecs[to], newSecs[from]];
    setSections(newSecs);
    const newHtml = reconstructHtml(headerHtml, newSecs);
    editor.commands.setContent(newHtml);
  };

  const deleteSectionFromEditor = (idx: number) => {
    if (!editor) return;
    const newSecs = sections.filter((_, i) => i !== idx);
    setSections(newSecs);
    const newHtml = reconstructHtml(headerHtml, newSecs);
    editor.commands.setContent(newHtml);
  };

  const addSectionToEditor = () => {
    if (!editor) return;
    const title = window.prompt("Section name (e.g. Volunteer Work, Awards, Languages):");
    if (!title?.trim()) return;
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: title.trim() }] },
      { type: "paragraph", content: [{ type: "text", text: "Add your content here." }] },
    ]).run();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ margin: "calc(-1 * var(--page-pad-y)) calc(-1 * var(--page-pad-x))", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f1f1f1" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #ddd", borderTopColor: "#b8963e", animation: "sig-spin 1s linear infinite", display: "inline-flex" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#666" }}>Loading editor…</span>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ margin: "calc(-1 * var(--page-pad-y)) calc(-1 * var(--page-pad-x))", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", color: "#666", marginBottom: 12 }}>Resume not found.</p>
          <Button variant="secondary" onClick={() => navigate("/resumes")}>Back to resumes</Button>
        </div>
      </div>
    );
  }

  const SaveIndicator = () => {
    if (saveStatus === "saving") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 12, color: "#999" }}>
        <RefreshCw size={11} strokeWidth={2} style={{ animation: "sig-spin 1s linear infinite" }} /> Saving…
      </span>
    );
    if (saveStatus === "saved") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 12, color: "#16a34a" }}>
        <Check size={11} strokeWidth={2.5} /> Saved
      </span>
    );
    if (saveStatus === "error") return (
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: 12, color: "#dc2626" }}>
        <AlertCircle size={11} strokeWidth={2} /> Save failed
      </span>
    );
    return null;
  };

  return (
    <>
      {/* Inject editor CSS */}
      <style>{EDITOR_CSS}</style>

      <div style={{ margin: "calc(-1 * var(--page-pad-y)) calc(-1 * var(--page-pad-x))", display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f1f1f1" }}>

        {/* ── Top bar ──────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "0 16px", height: 52,
          background: "var(--paper-50, #fff)",
          borderBottom: "1.5px solid var(--line-300)",
          position: "sticky", top: 0, zIndex: 30,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <button
            onClick={() => navigate(`/resumes/${id}`)}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--line-300)", background: "transparent", borderRadius: 6, cursor: "pointer", color: "var(--slate-600)", flexShrink: 0 }}
            title="Back to resume"
          >
            <ArrowLeft size={16} strokeWidth={1.9} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {resume.version_label}
              {resume.job_title ? ` · ${resume.job_title}` : ""}
              {resume.company_name ? ` at ${resume.company_name}` : ""}
            </div>
          </div>
          <SaveIndicator />
          <Button variant="secondary" size="sm" iconLeft={<Save size={13} strokeWidth={2} />} onClick={saveNow} disabled={saveStatus === "saving"}>
            Save
          </Button>
          <Button variant="gold" size="sm" iconLeft={<Download size={13} strokeWidth={2} />} onClick={exportPdf} disabled={exporting}>
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
        <EditorToolbar editor={editor} />

        {/* ── Body ─────────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "auto" }}>

          {/* A4 canvas */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 64px", display: "flex", justifyContent: "center" }}>
            <div ref={editorRef} style={{ position: "relative", width: 794 }}>
              {/* Page break lines */}
              <PageLines contentHeight={contentHeight} />

              {/* TipTap editor */}
              <div
                className={`resume-canvas template-${template}`}
                style={{
                  background: "#fff",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.1)",
                  minHeight: contentHeight > 1120 ? contentHeight + 40 : 1120,
                  width: 794,
                  position: "relative",
                  zIndex: 0,
                  cursor: "text",
                }}
                onClick={() => editor?.commands.focus()}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{
            width: 300, flexShrink: 0, overflowY: "auto",
            background: "var(--paper-50)", borderLeft: "1.5px solid var(--line-300)",
            padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24,
          }}>

            {/* Sections panel */}
            <SectionsPanel
              sections={sections}
              onMove={moveSectionInEditor}
              onDelete={deleteSectionFromEditor}
              onAdd={addSectionToEditor}
            />

            {/* Templates */}
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-500)", marginBottom: 10 }}>
                Template
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    style={{
                      padding: "10px 8px", border: template === t.id ? "2px solid var(--brass-500)" : "1.5px solid var(--line-300)",
                      borderRadius: 8, cursor: "pointer",
                      background: template === t.id ? "var(--brass-50, #fffbf0)" : "transparent",
                      fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: template === t.id ? 700 : 500,
                      color: template === t.id ? "var(--brass-800)" : "var(--ink-700)",
                    }}
                  >
                    {t.label}
                    {template === t.id && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
                        <Check size={11} strokeWidth={2.5} color="var(--brass-600)" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: "var(--paper-200)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--line-200)" }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-500)", marginBottom: 8 }}>
                Tips
              </div>
              {[
                "Click any text to edit it directly",
                "Use H2 for section headings",
                "Reorder sections with the ↑↓ buttons",
                "Changes auto-save every 3 seconds",
                "Export PDF renders exactly what you see",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 6, fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--slate-600)", lineHeight: 1.4, marginBottom: 5 }}>
                  <span style={{ color: "var(--brass-600)", flexShrink: 0 }}>·</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}
