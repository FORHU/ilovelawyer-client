"use client";

import { useEffect, useState } from "react";

/** Below this the visual viewport is just the browser's address bar moving, not a keyboard. */
const KEYBOARD_MIN = 80;

const CLOSED = { inset: 0, offsetTop: 0 };

/** Whether a field that raises the keyboard has focus. */
function typing() {
  const el = document.activeElement;
  return el instanceof HTMLElement && (el.isContentEditable || el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !["button", "checkbox", "radio", "submit", "file"].includes(el.type)));
}

/** Where the on-screen keyboard is, from the visual viewport.
 *
 * `inset`: how much of the bottom of the layout the keyboard covers. Phones keep the layout
 * viewport at full height when the keyboard opens, so a bar pinned to the bottom would sit under
 * it: add this as bottom padding to lift it.
 *
 * `offsetTop`: how far the browser has scrolled the layout up to show the focused field (iOS
 * Safari does this; Chrome on Android doesn't). Everything above the visible area is out of
 * sight, so a screen that fills the visible area starts this far down. */
export function useKeyboardViewport() {
  const [state, setState] = useState(CLOSED);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const read = () => {
      const offsetTop = Math.max(0, Math.round(vv.offsetTop));
      const covered = Math.round(window.innerHeight - vv.height - offsetTop);
      // A keyboard is only up while a field has focus. Some browsers skip the last `resize` when it
      // closes, which would leave the bar lifted over a blank band the height of the keyboard.
      const next = covered > KEYBOARD_MIN && typing() ? { inset: covered, offsetTop } : CLOSED;
      setState((prev) => (prev.inset === next.inset && prev.offsetTop === next.offsetTop ? prev : next));
    };
    read();
    vv.addEventListener("resize", read);
    vv.addEventListener("scroll", read);
    document.addEventListener("focusin", read);
    // Focus is on `body` for a beat between two fields, so wait to see where it lands.
    let settle = 0;
    const afterBlur = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(read, 120);
    };
    document.addEventListener("focusout", afterBlur);
    return () => {
      window.clearTimeout(settle);
      document.removeEventListener("focusout", afterBlur);
      vv.removeEventListener("resize", read);
      vv.removeEventListener("scroll", read);
      document.removeEventListener("focusin", read);
    };
  }, []);
  return state;
}
