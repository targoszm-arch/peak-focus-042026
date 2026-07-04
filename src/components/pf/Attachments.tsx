import { useRef } from "react";
import { Icon } from "@/ds";
import { useAttachments, formatBytes } from "@/hooks/use-attachments";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};

/** Upload + list files attached to one task or one project. */
export default function Attachments({ taskId, projectId }: { taskId?: string; projectId?: string }) {
  const { attachments, loading, uploading, error, upload, download, remove } = useAttachments({ taskId, projectId });
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <label style={{ ...fieldLabel, marginBottom: 0 }}>Files</label>
        {attachments.length > 0 && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>
            {attachments.length}
          </span>
        )}
      </div>

      {attachments.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 6, marginBottom: 8 }}>
          {attachments.map((a) => (
            <div
              key={a.id}
              title={`${a.fileName} · ${formatBytes(a.sizeBytes)}`}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 6px 7px 9px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", minWidth: 0 }}
            >
              <Icon name="DocumentProperty1Linear" size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {a.fileName}
              </span>
              <button
                onClick={() => void download(a)}
                title="Download"
                style={{ flexShrink: 0, width: 22, height: 22, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                <Icon name="ArrowDownProperty1Linear" size={13} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${a.fileName}"?`)) void remove(a);
                }}
                title="Delete"
                style={{ flexShrink: 0, width: 22, height: 22, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                <Icon name="TrashProperty1Linear" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!loading && attachments.length === 0 && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 2px 4px" }}>
            No files yet.
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            height: 36, borderRadius: "var(--radius-md)", border: "1.5px dashed var(--border-strong)",
            background: "transparent", cursor: uploading ? "default" : "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
            color: uploading ? "var(--text-tertiary)" : "var(--text-secondary)",
          }}
        >
          <Icon name="AddProperty1Linear" size={14} /> {uploading ? "Uploading…" : "Upload files"}
        </button>

        {error && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red-500)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
