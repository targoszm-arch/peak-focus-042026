import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Icon } from "@/ds";
import { useProjectWiki, EMPTY_DOC } from "@/hooks/use-project-wiki";

const btn: React.CSSProperties = {
  minWidth: 30,
  height: 30,
  padding: "0 8px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-soft)",
  background: "var(--surface-card)",
  cursor: "pointer",
  color: "var(--text-secondary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 800,
};
const btnActive: React.CSSProperties = { background: "var(--primary-500)", borderColor: "var(--primary-500)", color: "#fff" };

// Pulls plain text out of a Tiptap JSON doc for the collapsed card's preview.
function previewText(doc: JSONContent, max = 90): string {
  let out = "";
  const walk = (node: JSONContent) => {
    if (out.length >= max) return;
    if (node.text) out += node.text;
    else if (node.type === "paragraph" && out) out += " ";
    for (const child of node.content ?? []) walk(child);
  };
  walk(doc);
  return out.trim().slice(0, max);
}

function Toolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const items: { title: string; label: React.ReactNode; onClick: () => void; active: boolean }[] = [
    { title: "Bold", label: "B", onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { title: "Italic", label: <span style={{ fontStyle: "italic" }}>i</span>, onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { title: "Strikethrough", label: <span style={{ textDecoration: "line-through" }}>S</span>, onClick: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    { title: "Heading 1", label: "H1", onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { title: "Heading 2", label: "H2", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { title: "Heading 3", label: "H3", onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { title: "Bulleted list", label: <Icon name="TaskSquareProperty1Linear" size={15} />, onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { title: "Numbered list", label: "1.", onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { title: "Quote", label: "”", onClick: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { title: "Code block", label: "<>", onClick: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
    { title: "Divider", label: "—", onClick: () => editor.chain().focus().setHorizontalRule().run(), active: false },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "9px 10px", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-sunken)" }}>
      {items.map((it, i) => (
        <button key={i} type="button" title={it.title} onMouseDown={(e) => { e.preventDefault(); it.onClick(); }} style={{ ...btn, ...(it.active ? btnActive : {}) }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* The Wiki card + its full-screen Notion-style editor. Replaces the old
   Files/Links panels on the project page — one document per project. */
export default function ProjectWiki({ projectId, projectName, ownerId, readOnly }: { projectId: string; projectName: string; ownerId: string; readOnly: boolean }) {
  const { content, loading, saving, save } = useProjectWiki(projectId);
  const [open, setOpen] = useState(false);
  const loadedFor = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Write project details, decisions, anything worth documenting…" })],
    content: EMPTY_DOC,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      save(editor.getJSON(), ownerId);
    },
  });

  // Seed the editor once the row has loaded (and again if projectId changes).
  useEffect(() => {
    if (!editor || loading) return;
    if (loadedFor.current === projectId) return;
    editor.commands.setContent(content);
    loadedFor.current = projectId;
  }, [editor, loading, content, projectId]);

  const preview = loading ? "Loading…" : previewText(content) || "No content yet.";

  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", padding: 18, boxSizing: "border-box" }}>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}
      >
        <span style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", color: "var(--primary-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="NoteProperty1Bold" size={17} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Wiki</span>
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>{preview}</span>
        </span>
        <Icon name="ArrowRightProperty1Linear" size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0, marginTop: 6 }} />
      </button>

      {open &&
        createPortal(
          <div className="pf-notes-scrim" onClick={() => setOpen(false)}>
            <div className="pf-notes-panel" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", color: "var(--primary-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="NoteProperty1Bold" size={17} />
                </span>
                <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{projectName} — Wiki</span>
                {!readOnly && (
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)" }}>{saving ? "Saving…" : "Saved"}</span>
                )}
                <button onClick={() => setOpen(false)} title="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", width: 40, height: 40, margin: -8, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="CloseCircleProperty1Linear" size={24} />
                </button>
              </div>
              {!readOnly && editor && <Toolbar editor={editor} />}
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 24px" }}>
                <EditorContent editor={editor} className="pf-wiki-content" />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 18px", borderTop: "1px solid var(--border-soft)", background: "var(--surface-sunken)", flexShrink: 0 }}>
                <button onClick={() => setOpen(false)} style={{ height: 40, padding: "0 20px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700 }}>Done</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
