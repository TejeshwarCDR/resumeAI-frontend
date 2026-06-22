import React, { useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Link, Undo2, Redo2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, IndentIncrease, IndentDecrease,
  Heading2, ChevronDown, Highlighter, Baseline,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

const FONTS = [
  { label: "Helvetica", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
];

const SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24"];

const TEXT_COLORS = [
  "#000000", "#1a1a1a", "#333333", "#555555", "#777777", "#999999",
  "#b91c1c", "#c2410c", "#a16207", "#15803d", "#1d4ed8", "#6d28d9",
  "#be185d", "#0e7490", "#374151", "#111827",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff",
  "#fed7aa", "#a5f3fc", "#d1fae5", "#fde68a", "#f5d0fe",
];

function TBtn({
  active, disabled, onClick, title, children, danger,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, border: "none", borderRadius: 4, cursor: disabled ? "default" : "pointer",
        background: active ? "var(--ink-200, #e2e8f0)" : "transparent",
        color: danger ? "#dc2626" : active ? "var(--ink-900)" : "var(--slate-600, #475569)",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div style={{ width: 1, height: 20, background: "var(--line-300, #e2e8f0)", margin: "0 2px", flexShrink: 0 }} />;
}

function ColorPicker({
  colors, onSelect, trigger, title,
}: {
  colors: string[];
  onSelect: (c: string) => void;
  trigger: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title={title}
        style={{
          display: "inline-flex", alignItems: "center", gap: 1, border: "none",
          borderRadius: 4, cursor: "pointer", background: "transparent", padding: "0 2px",
          height: 28, color: "var(--slate-600)", flexShrink: 0,
        }}
      >
        {trigger}
        <ChevronDown size={10} strokeWidth={2} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 300, marginTop: 4,
          background: "var(--paper-50, #fff)", border: "1px solid var(--line-300, #e2e8f0)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 8,
          display: "grid", gridTemplateColumns: "repeat(8, 20px)", gap: 4,
        }}>
          {colors.map((c) => (
            <button
              key={c}
              onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
              title={c}
              style={{
                width: 20, height: 20, borderRadius: 4, border: "1.5px solid rgba(0,0,0,0.15)",
                background: c, cursor: "pointer", padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Dropdown({
  value, options, onChange, width, title,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  width?: number;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        title={title}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          height: 28, padding: "0 6px", border: "1px solid var(--line-300, #e2e8f0)",
          borderRadius: 4, cursor: "pointer", background: "var(--paper-100, #f8fafc)",
          fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-900)",
          minWidth: width ?? 80, justifyContent: "space-between", flexShrink: 0,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {current?.label ?? value}
        </span>
        <ChevronDown size={11} strokeWidth={2} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 300, marginTop: 4,
          background: "var(--paper-50, #fff)", border: "1px solid var(--line-300, #e2e8f0)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          minWidth: width ?? 80, maxHeight: 260, overflowY: "auto",
        }}>
          {options.map((o) => (
            <button
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "8px 12px", border: "none",
                background: o.value === value ? "var(--ink-100)" : "transparent",
                cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)",
                fontSize: 12.5, color: "var(--ink-900)", whiteSpace: "nowrap",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SizeInput({ editor }: { editor: Editor }) {
  const [val, setVal] = useState("11");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const apply = (size: string) => {
    setVal(size);
    setOpen(false);
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line-300, #e2e8f0)", borderRadius: 4, overflow: "hidden", height: 28, flexShrink: 0 }}>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); apply(val); }
          }}
          style={{
            width: 32, border: "none", outline: "none", padding: "0 4px",
            fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-900)",
            background: "var(--paper-100, #f8fafc)", height: "100%", textAlign: "center",
          }}
        />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v); }}
          style={{ border: "none", borderLeft: "1px solid var(--line-300)", background: "var(--paper-100)", cursor: "pointer", padding: "0 3px", height: "100%", display: "flex", alignItems: "center" }}
        >
          <ChevronDown size={10} strokeWidth={2} color="var(--slate-500)" />
        </button>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 300, marginTop: 4,
          background: "var(--paper-50)", border: "1px solid var(--line-300)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 56,
        }}>
          {SIZES.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); apply(s); }}
              style={{
                display: "block", width: "100%", padding: "6px 12px", border: "none",
                background: s === val ? "var(--ink-100)" : "transparent",
                cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5,
                color: "var(--ink-900)", textAlign: "center",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const currentFont = editor.getAttributes("textStyle").fontFamily ?? FONTS[0].value;

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: 3,
      padding: "6px 12px", background: "var(--paper-50, #fff)",
      borderBottom: "1.5px solid var(--line-300, #e2e8f0)",
      position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* History */}
      <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
        <Undo2 size={14} strokeWidth={2} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
        <Redo2 size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Font family */}
      <Dropdown
        value={currentFont}
        options={FONTS}
        onChange={(v) => editor.chain().focus().setFontFamily(v).run()}
        width={110}
        title="Font family"
      />

      {/* Font size */}
      <SizeInput editor={editor} />
      <Separator />

      {/* Formatting */}
      <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <Bold size={14} strokeWidth={2.5} />
      </TBtn>
      <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <Italic size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
        <Underline size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Text color */}
      <ColorPicker
        colors={TEXT_COLORS}
        onSelect={(c) => editor.chain().focus().setColor(c).run()}
        title="Text color"
        trigger={<Baseline size={14} strokeWidth={2} color={editor.getAttributes("textStyle").color || "currentColor"} />}
      />

      {/* Highlight */}
      <ColorPicker
        colors={HIGHLIGHT_COLORS}
        onSelect={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        title="Highlight color"
        trigger={<Highlighter size={14} strokeWidth={2} />}
      />
      <Separator />

      {/* Headings */}
      <TBtn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Section heading (H2)"
      >
        <Heading2 size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Alignment */}
      <TBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
        <AlignLeft size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
        <AlignCenter size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
        <AlignRight size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
        <AlignJustify size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Lists */}
      <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <List size={14} strokeWidth={2} />
      </TBtn>
      <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <ListOrdered size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Indent */}
      <TBtn onClick={() => editor.chain().focus().sinkListItem("listItem").run()} disabled={!editor.can().sinkListItem("listItem")} title="Increase indent">
        <IndentIncrease size={14} strokeWidth={2} />
      </TBtn>
      <TBtn onClick={() => editor.chain().focus().liftListItem("listItem").run()} disabled={!editor.can().liftListItem("listItem")} title="Decrease indent">
        <IndentDecrease size={14} strokeWidth={2} />
      </TBtn>
      <Separator />

      {/* Link */}
      <TBtn active={editor.isActive("link")} onClick={addLink} title="Insert link">
        <Link size={14} strokeWidth={2} />
      </TBtn>
    </div>
  );
}
