import { useEffect } from "react";

/* Native-feeling on-screen-keyboard handling for the fixed app shell.

   The shell is a 100dvh frame whose only scroller is .pf-scroll, so the
   document must always sit at scroll 0. Mobile Safari instead force-scrolls
   the DOCUMENT to lift a focused field above the keyboard — and often leaves
   that scroll behind afterwards.

   What native apps (and e.g. the Claude app) do: shrink the content to the
   area ABOVE the keyboard and bring the focused field into that area. This
   hook reproduces that:

   - while the keyboard is open, --pf-vvh is set to the visual-viewport
     height; .pf-shell uses height: var(--pf-vvh, 100dvh), so the layout
     shrinks to the visible area,
   - the document is pinned at scroll 0 (the shell now fits, Safari has
     nothing to reveal by panning),
   - the focused field is scrolled into view INSIDE the inner scroller,
   - when the keyboard closes (blur or the keyboard's own dismiss), the
     override is removed and the document scroll is restored.

   Keyboard state is detected from the visual-viewport height against a
   baseline captured while no field is focused — window.innerHeight is NOT
   trusted, because iOS shrinks it together with the visual viewport, which
   made naive "keyboard closed" checks fire while it was still open. */

const VAR = "--pf-vvh";
const KEYBOARD_MIN_PX = 150; // smaller viewport changes = browser chrome, not keyboard

function isEditable(el: Element | EventTarget | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function useKeyboardSnapback() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    let baseline = vv.height;
    let keyboardOpen = false;
    let revealTimer: number | undefined;

    const pin = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
    };

    // Bring the focused field into the shrunken visible area — scrolls the
    // nearest scrollable ancestor (.pf-scroll or a modal body), never the
    // pinned document.
    const reveal = () => {
      const el = document.activeElement;
      if (isEditable(el)) el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    const scheduleReveal = (delay: number) => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(reveal, delay);
    };

    const sync = () => {
      const kbNow = baseline - vv.height > KEYBOARD_MIN_PX && isEditable(document.activeElement);
      if (kbNow) {
        root.style.setProperty(VAR, `${Math.round(vv.height)}px`);
        pin();
        if (!keyboardOpen) scheduleReveal(80);
        keyboardOpen = true;
        return;
      }
      if (keyboardOpen) {
        keyboardOpen = false;
        root.style.removeProperty(VAR);
        pin();
      }
      // Track the true full height while no keyboard is up (rotation,
      // browser-chrome changes).
      if (baseline - vv.height <= KEYBOARD_MIN_PX) baseline = Math.max(baseline, vv.height);
      if (!isEditable(document.activeElement)) baseline = vv.height > baseline ? vv.height : baseline;
    };

    // Focus moved between fields while the keyboard stays open — re-reveal.
    const onFocusIn = (e: FocusEvent) => {
      if (isEditable(e.target)) scheduleReveal(keyboardOpen ? 80 : 350);
    };

    // Safety net for blur without a viewport resize.
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isEditable(document.activeElement) && !keyboardOpen) pin();
      }, 250);
    };

    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.clearTimeout(revealTimer);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      root.style.removeProperty(VAR);
    };
  }, []);
}
