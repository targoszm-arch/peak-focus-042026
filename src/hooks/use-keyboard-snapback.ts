import { useEffect } from "react";

/* Native-feeling on-screen-keyboard handling for the fixed app shell.

   The shell is a 100dvh frame whose only scroller is .pf-scroll, so the
   document must always sit at scroll 0. Mobile Safari instead force-scrolls
   the DOCUMENT to lift a focused field above the keyboard — and often leaves
   that scroll behind afterwards.

   While the keyboard is open this hook:
   - sets --pf-vvh to the visual-viewport height (.pf-shell shrinks to the
     visible area, .pf-peak hero collapses via the pf-kb-open class),
   - pins the document at scroll 0,
   - scrolls the focused field into view inside the inner scroller.
   When the keyboard closes — blur, Save/Cancel unmounting the field, or the
   keyboard's own dismiss — everything resets.

   Design notes (learned the hard way):
   - window.innerHeight is never trusted: iOS shrinks it together with the
     visual viewport, so naive "keyboard closed" checks fire while it's open.
   - The reset must NOT be gated on having seen the keyboard open. Native
     inputs commit document.activeElement before the resize burst, but
     contentEditable can lag it, and unmounting a focused field (modal Save)
     fires no blur — so sync() also runs on focusin/focusout and the reset
     branch fires whenever the shrink is gone, latch or no latch. */

const VAR = "--pf-vvh";
const KB_CLASS = "pf-kb-open";
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
    let shrunk = false; // whether --pf-vvh is currently applied
    let revealTimer: number | undefined;
    let syncTimer: number | undefined;

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

    const reset = () => {
      if (shrunk) {
        shrunk = false;
        root.style.removeProperty(VAR);
        root.classList.remove(KB_CLASS);
      }
      pin();
    };

    let ambiguousSince = 0;

    const sync = () => {
      const editable = isEditable(document.activeElement);
      const keyboardUp = baseline - vv.height > KEYBOARD_MIN_PX;

      if (keyboardUp && editable) {
        ambiguousSince = 0;
        root.style.setProperty(VAR, `${Math.round(vv.height)}px`);
        root.classList.add(KB_CLASS);
        pin();
        if (!shrunk) scheduleReveal(80);
        shrunk = true;
        return;
      }

      if (!keyboardUp) {
        // Keyboard is gone — always undo, whether or not we ever saw it open.
        ambiguousSince = 0;
        reset();
        baseline = Math.max(baseline, vv.height);
        if (!editable) baseline = vv.height;
        return;
      }

      // Shrunken viewport but nothing editable focused: either focus isn't
      // committed yet (contentEditable), a focused field was just unmounted
      // (modal Save) with the close resize still in flight, or the baseline
      // is stale (rotation). Undo the shrink now, and if the state persists
      // past one recheck, adopt the new height as the baseline.
      reset();
      const now = Date.now();
      if (!ambiguousSince) {
        ambiguousSince = now;
        scheduleSync(450);
      } else if (now - ambiguousSince > 400) {
        ambiguousSince = 0;
        baseline = vv.height;
      }
    };

    const scheduleSync = (delay: number) => {
      window.clearTimeout(syncTimer);
      syncTimer = window.setTimeout(sync, delay);
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isEditable(e.target)) return;
      // Latch + reveal even if the keyboard finished opening before the
      // focus was committed (contentEditable) — no resize would arrive then.
      sync();
      scheduleSync(350);
      scheduleReveal(shrunk ? 80 : 380);
    };

    // Blur — including a focused field being unmounted (modal Save/Cancel),
    // which fires no blur but also leaves nothing editable focused; the
    // delayed sync sees the restored viewport and resets.
    const onFocusOut = () => scheduleSync(300);

    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(syncTimer);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      root.style.removeProperty(VAR);
      root.classList.remove(KB_CLASS);
    };
  }, []);
}
