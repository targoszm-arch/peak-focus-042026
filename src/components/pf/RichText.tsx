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
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
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

  return (
    <div style={{ border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--surface-card)" }}>
      <div style={{ display: "flex", gap: 6, padding: "7px 8px", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-sunken)" }}>
        <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} style={btn}>B</button>
        <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} style={{ ...btn, fontStyle: "italic", fontWeight: 600 }}>i</button>
        <button type="button" title="Bulleted list" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} style={btn}>
          <Icon name="TaskSquareProperty1Linear" size={15} />
        </button>
        <button type="button" title="Numbered list" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} style={{ ...btn, fontSize: 11 }}>1.</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="pf-richtext"
        style={{
          minHeight: 96,
          maxHeight: 220,
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
