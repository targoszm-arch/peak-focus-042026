import { useEffect } from "react";
import { Icon } from "@/ds";
import QuickAdd from "@/components/pf/QuickAdd";

export default function QuickAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("pf-modal-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("pf-modal-open");
    };
  }, [open, onClose]);

  if (!open) return null;

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
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", animation: "pf-pop .2s ease both" }}>
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
        <QuickAdd autoFocus placeholder="What needs doing?" onAdded={onClose} />
      </div>
    </div>
  );
}
