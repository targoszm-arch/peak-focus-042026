import { useState } from "react";
import { Icon } from "@/ds";
import { useProjectLinks, type ProjectLink } from "@/hooks/use-project-links";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconOf(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return "";
  }
}

function LinkCard({ link, onRemove }: { link: ProjectLink; onRemove: (l: ProjectLink) => void }) {
  const [broken, setBroken] = useState(false);
  const host = hostOf(link.url);
  const title = link.title || host;
  const favicon = faviconOf(link.url);

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 11, padding: 9, borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", minWidth: 0 }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.url}
        style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}
      >
        <span
          style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
        >
          {favicon && !broken ? (
            <img src={favicon} alt="" width={24} height={24} style={{ display: "block" }} onError={() => setBroken(true)} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
          )}
        </span>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 1 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {host}
          </span>
        </span>
      </a>
      <button
        onClick={() => { if (window.confirm(`Remove this link?`)) onRemove(link); }}
        title="Remove"
        style={{ flexShrink: 0, width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red-500)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
      >
        <Icon name="TrashProperty1Linear" size={14} />
      </button>
    </div>
  );
}

/** Bookmarked URLs on a project, shown as thumbnail cards under the Files box. */
export default function ProjectLinks({ projectId }: { projectId: string }) {
  const { links, loading, error, add, remove } = useProjectLinks(projectId);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAdding(true);
    await add(trimmed, title);
    setUrl("");
    setTitle("");
    setAdding(false);
  };

  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", padding: 18, boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <label style={{ ...fieldLabel, marginBottom: 0 }}>Links</label>
        {links.length > 0 && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>
            {links.length}
          </span>
        )}
      </div>

      {links.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
          {links.map((l) => (
            <LinkCard key={l.id} link={l} onRemove={remove} />
          ))}
        </div>
      )}

      {!loading && links.length === 0 && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 2px 8px" }}>
          No links yet — paste a URL below.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
          placeholder="Paste a URL…"
          style={{ height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", padding: "0 11px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 7 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
            placeholder="Label (optional)"
            style={{ flex: 1, minWidth: 0, height: 34, borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", padding: "0 11px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-primary)", outline: "none" }}
          />
          <button
            onClick={() => void submit()}
            disabled={adding || !url.trim()}
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: "var(--radius-md)", border: "none", background: url.trim() ? "var(--primary-500)" : "var(--border-strong)", color: "#fff", cursor: url.trim() ? "pointer" : "default", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700 }}
          >
            <Icon name="AddProperty1Linear" size={14} /> Add
          </button>
        </div>
        {error && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red-500)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
