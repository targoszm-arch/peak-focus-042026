import { useRef, useState } from "react";
import { Icon } from "@/ds";
import { useAttachments, formatBytes } from "@/hooks/use-attachments";
import { ModalShell } from "./modals";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};

const MAX_COMPACT = 4;

/**
 * Upload + list files attached to one task or one project.
 * In `compact` mode (for sitting side-by-side with other cards), only the
 * first few files show; the rest are behind a "+N more" button that opens
 * this same component full-size in a modal.
 */
export default function Attachments({ taskId, projectId, compact = false }: { taskId?: string; projectId?: string; compact?: boolean }) {
  const { attachments, loading, uploading, error, upload, download, remove, reload } = useAttachments({ taskId, projectId });
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewAll, setViewAll] = useState(false);

  const visible = compact ? attachments.slice(0, MAX_COMPACT) : attachments;
  const hidden = attachments.length - visible.length;

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

      {visible.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 8 }}>
          {visible.map((a) => (
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

      {compact && hidden > 0 && (
        <button
          onClick={() => setViewAll(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8,
            border: "none", background: "transparent", padding: 0, cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--primary-500)",
          }}
        >
          +{hidden} more <Icon name="ArrowRightProperty1Linear" size={12} />
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!loading && attachments.length === 0 && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 2px 4px" }}>
            No files yet.
          </div>
        )}

        {compact ? (
          <button
            onClick={() => setViewAll(true)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              height: 32, borderRadius: "var(--radius-md)", border: "1.5px dashed var(--border-strong)",
              background: "transparent", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)",
            }}
          >
            <Icon name="AddProperty1Linear" size={13} /> Upload files
          </button>
        ) : (
          <>
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
          </>
        )}

        {error && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red-500)" }}>{error}</div>
        )}
      </div>

      {viewAll && (
        <ModalShell title="Files" icon="DocumentProperty1Linear" width={780} onClose={() => { setViewAll(false); void reload(); }} footer={null}>
          <Attachments taskId={taskId} projectId={projectId} />
        </ModalShell>
      )}
    </div>
  );
}
