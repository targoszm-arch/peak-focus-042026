import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/ds";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)",
};
const areaBase: React.CSSProperties = {
  width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)",
  background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: 14,
  lineHeight: 1.55, color: "var(--text-primary)", outline: "none", boxSizing: "border-box", padding: "10px 12px",
};
const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

/* Notes textarea with a full-screen expand mode (fills the screen on mobile). */
export default function NotesField({
  value,
  onChange,
  label = "Notes",
  placeholder = "Anything this task needs — links, context, next actions…",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const [full, setFull] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
        <label style={fieldLabel}>{label}</label>
        <button
          type="button"
          onClick={() => setFull(true)}
          title="Expand to full screen"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 9px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700 }}
        >
          <ExpandIcon /> Expand
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...areaBase, minHeight: 140, resize: "vertical" }}
      />

      {full &&
        createPortal(
          <div className="pf-notes-scrim" onClick={() => setFull(false)}>
            <div className="pf-notes-panel" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", color: "var(--primary-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="NoteProperty1Linear" size={17} />
                </span>
                <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{label}</span>
                <button onClick={() => setFull(false)} title="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", width: 40, height: 40, margin: -8, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="CloseCircleProperty1Linear" size={24} />
                </button>
              </div>
              <textarea
                autoFocus
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ ...areaBase, flex: 1, border: "none", borderRadius: 0, fontSize: 15, padding: "18px 20px", resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 18px", borderTop: "1px solid var(--border-soft)", background: "var(--surface-sunken)", flexShrink: 0 }}>
                <button onClick={() => setFull(false)} style={{ height: 40, padding: "0 20px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700 }}>Done</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
