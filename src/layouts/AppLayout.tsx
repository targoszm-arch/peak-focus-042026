import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/shell/Sidebar";
import PeakProgress from "@/components/shell/PeakProgress";
import QuickAddModal from "@/components/shell/QuickAddModal";

const logo = "/brand/peak-focus-logo-transparent.png";

export default function AppLayout() {
  const [open, setOpen] = useState(false); // mobile drawer
  const [quickOpen, setQuickOpen] = useState(false);

  // Keyboard: N opens quick add, Esc closes overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el && (/input|textarea|select/i.test(el.tagName) || (el as HTMLElement).isContentEditable);
      if (e.key === "Escape") {
        setQuickOpen(false);
        setOpen(false);
      } else if ((e.key === "n" || e.key === "N") && !typing && !quickOpen) {
        e.preventDefault();
        setQuickOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quickOpen]);

  return (
    <div className="pf-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} onQuickAdd={() => setQuickOpen(true)} />

      {/* mobile drawer scrim */}
      <div
        className={"pf-sidebar-backdrop" + (open ? " show" : "")}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <div className="pf-main">
        {/* mobile-only topbar with hamburger */}
        <div className="pf-mobile-topbar">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface-card)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <img src={logo} alt="Peak Focus" style={{ height: 26 }} />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 17,
                color: "var(--text-primary)",
              }}
            >
              Peak Focus
            </span>
          </div>

          <button
            aria-label="Quick add"
            onClick={() => setQuickOpen(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--primary-500)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <PeakProgress />

        <div className="pf-scroll">
          <Outlet />
        </div>
      </div>

      <QuickAddModal open={quickOpen} onClose={() => setQuickOpen(false)} />
    </div>
  );
}
