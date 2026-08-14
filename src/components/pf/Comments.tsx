import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useComments } from "@/hooks/use-comments";
import { useCollaborators } from "@/hooks/use-collaborators";
import { supabase } from "@/lib/supabase";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};

type Mentionable = { id: string; label: string; isOwner: boolean };

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}

/** Highlights "@Name" runs that match a known mentionable label. */
function renderBody(body: string, people: Mentionable[]): React.ReactNode {
  if (!people.length) return body;
  const names = people.map((p) => p.label).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`@(${names.join("|")})`, "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(body))) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    parts.push(
      <span key={i++} style={{ color: "var(--primary-500)", fontWeight: 700 }}>
        @{m[1]}
      </span>
    );
    last = re.lastIndex;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts;
}

/**
 * Comment thread — project-level when `taskId` is omitted, task-level
 * otherwise. Visible/postable by the project owner and any active
 * collaborator (view+comment, per project_collaborators access).
 */
export default function Comments({ projectId, ownerId, taskId }: { projectId: string; ownerId: string; taskId?: string }) {
  const { user } = useAuth();
  const { comments, loading, add } = useComments(projectId, taskId);
  const { collaborators } = useCollaborators(projectId);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", ownerId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setOwnerName((data?.display_name as string | undefined) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const mentionable: Mentionable[] = useMemo(() => {
    const list: Mentionable[] = [];
    if (ownerId !== user?.id) list.push({ id: ownerId, label: ownerName || "Owner", isOwner: true });
    for (const c of collaborators) {
      if (c.status !== "active" || !c.userId || c.userId === user?.id) continue;
      list.push({ id: c.userId, label: c.invitedEmail.split("@")[0], isOwner: false });
    }
    return list;
  }, [ownerId, ownerName, collaborators, user?.id]);

  const authorLabel = (authorId: string): string => {
    if (authorId === user?.id) return "You";
    if (authorId === ownerId) return ownerName || "Workspace owner";
    const c = collaborators.find((x) => x.userId === authorId);
    return c ? c.invitedEmail.split("@")[0] : "Someone";
  };

  const filteredMentions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentionable.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, mentionable]);

  const onDraftChange = (v: string, caret: number) => {
    setDraft(v);
    const upToCaret = v.slice(0, caret);
    const m = /(?:^|\s)@([\w-]*)$/.exec(upToCaret);
    setMentionQuery(m ? m[1] : null);
  };

  const insertMention = (person: Mentionable) => {
    const el = taRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const upToCaret = draft.slice(0, caret);
    const m = /(?:^|\s)@([\w-]*)$/.exec(upToCaret);
    if (!m) return;
    const start = caret - m[1].length;
    const next = `${draft.slice(0, start)}${person.label} ${draft.slice(caret)}`;
    setDraft(next);
    setMentionQuery(null);
    requestAnimationFrame(() => el?.focus());
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const mentionIds = mentionable.filter((m) => text.includes(`@${m.label}`)).map((m) => m.id);
    await add(text, mentionIds);
    setDraft("");
    setMentionQuery(null);
    setSending(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <label style={{ ...fieldLabel, marginBottom: 0 }}>Comments</label>
        {comments.length > 0 && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>{comments.length}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {!loading && comments.length === 0 && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 2px 4px" }}>
            No comments yet.
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} style={{ padding: "9px 11px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>{authorLabel(c.authorId)}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-tertiary)" }}>{timeAgo(c.createdAt)}</span>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.5, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {renderBody(c.body, mentionable)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        {filteredMentions.length > 0 && (
          <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 6, width: 220, background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)", overflow: "hidden", zIndex: 5 }}>
            {filteredMentions.map((m) => (
              <button
                key={m.id}
                onClick={() => insertMention(m)}
                style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "8px 11px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-sunken)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Icon name="Profile2userProperty1Linear" size={13} style={{ color: "var(--text-tertiary)" }} />
                {m.label}
                {m.isOwner && <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>· owner</span>}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={taRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !filteredMentions.length) {
              e.preventDefault();
              void submit();
            } else if (e.key === "Escape") {
              setMentionQuery(null);
            }
          }}
          placeholder="Add a comment — type @ to mention someone…"
          rows={2}
          style={{
            width: "100%", resize: "vertical", minHeight: 60, padding: "9px 11px", borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-strong)", background: "var(--surface-card)", outline: "none", boxSizing: "border-box",
            fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button
          onClick={() => void submit()}
          disabled={sending || !draft.trim()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: "var(--radius-md)",
            border: "none", background: draft.trim() ? "var(--primary-500)" : "var(--border-strong)", color: "#fff",
            cursor: draft.trim() ? "pointer" : "default", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
          }}
        >
          <Icon name="MessageProperty1Bold" size={14} /> {sending ? "Posting…" : "Comment"}
        </button>
      </div>
    </div>
  );
}
