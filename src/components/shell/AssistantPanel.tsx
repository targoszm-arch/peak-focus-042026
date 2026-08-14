import { Fragment, useEffect, useRef, useState } from "react";
import { Icon } from "@/ds";
import { supabase } from "@/lib/supabase";
import { useAccess } from "@/hooks/use-access";

type ChatMsg = {
  role: "user" | "assistant" | "error";
  text: string;
  actions?: { tool: string; args: Record<string, unknown>; result: unknown }[];
};

function actionLabel(a: { tool: string; args: Record<string, unknown>; result: unknown }): string {
  const err = (a.result as { error?: string } | null)?.error;
  if (err) return `${a.tool} failed: ${err}`;
  switch (a.tool) {
    case "create_task": return `Created task "${a.args.title ?? ""}"`;
    case "update_task": return `Updated task`;
    case "complete_task": return a.args.done === false ? "Reopened task" : "Completed task";
    case "delete_task": return "Deleted task";
    case "add_checklist_steps": return `Added ${(a.args.steps as unknown[] | undefined)?.length ?? ""} checklist step(s)`;
    case "create_project": return `Created project "${a.args.name ?? ""}"`;
    case "update_project": return "Updated project";
    default: return a.tool;
  }
}

const READ_ONLY_TOOLS = new Set(["list_projects", "get_project", "list_tasks", "list_clients", "list_recent_meetings"]);

/* ── tiny, dependency-free markdown renderer for assistant replies —
   handles the headers/bold/bullets/numbered-lists Claude reliably produces,
   without pulling in a markdown library or risking raw HTML injection
   (everything below builds React elements, never dangerouslySetInnerHTML). ── */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const chunk = match[0];
    if (chunk.startsWith("**")) parts.push(<strong key={`${keyPrefix}-${i++}`}>{chunk.slice(2, -2)}</strong>);
    else if (chunk.startsWith("`")) {
      parts.push(
        <code key={`${keyPrefix}-${i++}`} style={{ background: "var(--surface-sunken)", borderRadius: 4, padding: "1px 5px", fontSize: "0.92em" }}>
          {chunk.slice(1, -1)}
        </code>
      );
    } else parts.push(<em key={`${keyPrefix}-${i++}`}>{chunk.slice(1, -1)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(
        <div key={key} style={{ fontWeight: 800, fontSize: 13.5, marginTop: blocks.length ? 6 : 0 }}>
          {renderInline(line.replace(/^#{1,3}\s+/, ""), `h${key++}`)}
        </div>
      );
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
      blocks.push(
        <ul key={key} style={{ margin: "2px 0", paddingLeft: 18 }}>
          {items.map((it, j) => <li key={j} style={{ marginBottom: 2 }}>{renderInline(it, `li${key}-${j}`)}</li>)}
        </ul>
      );
      key++;
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      blocks.push(
        <ol key={key} style={{ margin: "2px 0", paddingLeft: 18 }}>
          {items.map((it, j) => <li key={j} style={{ marginBottom: 2 }}>{renderInline(it, `oli${key}-${j}`)}</li>)}
        </ol>
      );
      key++;
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^#{1,3}\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <div key={key}>
        {paraLines.map((pl, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(pl, `p${key}-${j}`)}
          </Fragment>
        ))}
      </div>
    );
    key++;
  }
  return <>{blocks}</>;
}

export default function AssistantPanel({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId?: string }) {
  const { isOwner } = useAccess();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("pf-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("pf-modal-open");
    };
  }, [open, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!open) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: {
          messages: next.filter((m) => m.role !== "error").map((m) => ({ role: m.role, content: m.text })),
          projectId,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const actions = ((data?.actions as { tool: string; args: Record<string, unknown>; result: unknown }[]) ?? []).filter(
        (a) => !READ_ONLY_TOOLS.has(a.tool)
      );
      setMessages((cur) => [...cur, { role: "assistant", text: data?.reply || "(no response)", actions }]);
    } catch (e) {
      setMessages((cur) => [...cur, { role: "error", text: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,22,37,.42)",
        display: "flex", justifyContent: "flex-end", backdropFilter: "blur(2px)",
        touchAction: "none", overscrollBehavior: "none",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxWidth: "94vw", height: "100%", background: "var(--surface-card)",
          display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg, -8px 0 24px rgba(0,0,0,.12))",
          animation: "pf-pop .2s ease both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
          <Icon name="MessageProperty1Bold" size={19} style={{ color: "var(--primary-500)" }} />
          <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>Assistant</span>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "inline-flex" }}>
            <Icon name="CloseCircleProperty1Linear" size={20} />
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.5 }}>
              {isOwner === false
                ? "Ask me for a status report on your project, or what's overdue or in progress — I can read the project(s) you've been given access to, but I can't make changes for you."
                : "Ask me to plan your day, summarize a project, or create/update tasks — I can read your projects, tasks, and clients, and act on them directly."}
              {projectId && <div style={{ marginTop: 8 }}>Scoped to the project you're currently viewing, unless you ask about something else.</div>}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "88%", padding: "9px 13px", borderRadius: "var(--radius-lg)",
                  fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.5,
                  whiteSpace: m.role === "user" ? "pre-wrap" : "normal",
                  background: m.role === "user" ? "var(--primary-500)" : m.role === "error" ? "color-mix(in srgb, var(--red-500) 10%, white)" : "var(--surface-page)",
                  color: m.role === "user" ? "#fff" : m.role === "error" ? "var(--red-500)" : "var(--text-primary)",
                }}
              >
                {m.role === "assistant" ? renderMarkdown(m.text) : m.text}
              </div>
              {!!m.actions?.length && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {m.actions.map((a, j) => (
                    <span
                      key={j}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--radius-full)",
                        fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600,
                        background: (a.result as { error?: string } | null)?.error ? "color-mix(in srgb, var(--red-500) 10%, white)" : "color-mix(in srgb, var(--green-600, #2A9E75) 12%, white)",
                        color: (a.result as { error?: string } | null)?.error ? "var(--red-500)" : "var(--green-600, #1F7757)",
                      }}
                    >
                      <Icon name={(a.result as { error?: string } | null)?.error ? "CloseCircleProperty1Linear" : "TickCircleProperty1Bold"} size={12} />
                      {actionLabel(a)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", padding: "9px 13px", borderRadius: "var(--radius-lg)", background: "var(--surface-page)", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 13.5 }}>
              Thinking…
            </div>
          )}
        </div>

        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--border-soft)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask the assistant…"
              rows={1}
              style={{
                flex: 1, resize: "none", maxHeight: 120, padding: "10px 12px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-soft)", background: "var(--surface-page)", outline: "none",
                fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: "var(--radius-md)", border: "none", flexShrink: 0,
                background: loading || !input.trim() ? "var(--border-soft)" : "var(--primary-500)",
                color: "#fff", cursor: loading || !input.trim() ? "default" : "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="ArrowDownProperty1Linear" size={17} style={{ transform: "rotate(180deg)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
