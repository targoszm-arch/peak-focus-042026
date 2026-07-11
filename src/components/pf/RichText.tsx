import { useEffect, useRef } from "react";
import { Icon } from "@/ds";

/* Minimal rich-text editor (bold / italic / bullet + numbered lists) backed by
   a contentEditable div. Stores HTML. No external deps. */

const btn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-soft)",
  background: "var(--surface-card)",
  cursor: "pointer",
  color: "var(--text-secondary)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
};

export default function RichText({
  value,
  onChange,
  placeholder = "Describe what this project is about…",
  minHeight = 96,
  maxHeight = 220,
  fill = false,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Seed once; afterwards the DOM is the source of truth (avoids caret jumps).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
    onChange(ref.current?.innerHTML ?? "");
  };

  const addLink = () => {
    ref.current?.focus();
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      document.execCommand("insertHTML", false, `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>&nbsp;`);
    } else {
      document.execCommand("createLink", false, href);
    }
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-card)", ...(fill ? { display: "flex", flexDirection: "column", height: "100%" } : {}) }}>
      <div style={{ display: "flex", gap: 6, padding: "7px 8px", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-sunken)" }}>
        <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} style={btn}>B</button>
        <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} style={{ ...btn, fontStyle: "italic", fontWeight: 600 }}>i</button>
        <button type="button" title="Bulleted list" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} style={btn}>
          <Icon name="TaskSquareProperty1Linear" size={15} />
        </button>
        <button type="button" title="Numbered list" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} style={{ ...btn, fontSize: 11 }}>1.</button>
        <button type="button" title="Insert link" onMouseDown={(e) => { e.preventDefault(); addLink(); }} style={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="pf-richtext"
        style={{
          ...(fill ? { flex: 1, minHeight: 0 } : { minHeight, maxHeight }),
          overflowY: "auto",
          padding: "12px 14px",
          outline: "none",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
