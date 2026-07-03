import { useEffect } from "react";

/* The app shell is a fixed 100dvh frame whose only scroller is .pf-scroll —
   the document itself must always sit at scrollY 0. iOS Safari force-scrolls
   the DOCUMENT to lift a focused field above the on-screen keyboard and often
   leaves that scroll behind when the keyboard closes, so the whole shell
   stays shifted. This hook snaps the document back whenever the keyboard
   goes away. Mounted once at the app root; covers every input, textarea,
   select and contenteditable in the app. */

function isEditable(el: EventTarget | Element | null): boolean {
  if (!el || !(el instanceof Element)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

function snapBack() {
  if (window.scrollX !== 0 || window.scrollY !== 0) {
    window.scrollTo(0, 0);
  }
}

export function useKeyboardSnapback() {
  useEffect(() => {
    let timer: number | undefined;

    // Keyboard closed via blur (tap outside / Done button focuses nothing).
    // Wait a beat so focus hopping between fields (e.g. checklist steps)
    // doesn't cause a snap mid-edit.
    const onFocusOut = (e: FocusEvent) => {
      if (!isEditable(e.target)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!isEditable(document.activeElement)) snapBack();
      }, 250);
    };

    // Keyboard dismissed with the keyboard's own control — focus stays on the
    // field and no focusout fires, but the visual viewport grows back.
    const vv = window.visualViewport;
    const onViewportResize = () => {
      if (!vv) return;
      const keyboardClosed = window.innerHeight - vv.height < 80;
      if (keyboardClosed) {
        window.clearTimeout(timer);
        timer = window.setTimeout(snapBack, 100);
      }
    };

    document.addEventListener("focusout", onFocusOut);
    vv?.addEventListener("resize", onViewportResize);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusout", onFocusOut);
      vv?.removeEventListener("resize", onViewportResize);
    };
  }, []);
}
