import { useEffect, useRef, useState } from "react";
import { Icon } from "@/ds";
import { useTasks } from "@/hooks/use-tasks";

export default function QuickAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTask } = useTasks();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
    else setName("");
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    const t = name.trim();
    if (!t) return;
    // Default a quick-add to "due today" so it shows on the summit + Today.
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    await addTask({ title: t, endsAt: iso, priority: "medium" });
    setName("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(17,22,37,.42)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: "92vw", animation: "pf-pop .2s ease both" }}
      >
        <div
          style={{
            marginBottom: 10,
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="AddProperty1Bold" size={16} /> Quick add — press Esc to close
        </div>
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-lg)",
            padding: 12,
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-md)",
              background: "var(--secondary-500)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="AddProperty1Bold" size={20} />
          </span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              else if (e.key === "Escape") onClose();
            }}
            placeholder="What needs doing?"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              height: 34,
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: name.trim() ? "var(--primary-500)" : "var(--neutral-200)",
              color: name.trim() ? "#fff" : "var(--text-tertiary)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 700,
              cursor: name.trim() ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
