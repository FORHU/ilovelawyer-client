"use client";

import { useEffect, useState } from "react";

/** Below this the visual viewport is just the browser's address bar moving, not a keyboard. */
const KEYBOARD_MIN = 80;

const CLOSED = { inset: 0, offsetTop: 0 };

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
      const next = covered > KEYBOARD_MIN ? { inset: covered, offsetTop } : CLOSED;
      setState((prev) => (prev.inset === next.inset && prev.offsetTop === next.offsetTop ? prev : next));
    };
    read();
    vv.addEventListener("resize", read);
    vv.addEventListener("scroll", read);
    return () => {
      vv.removeEventListener("resize", read);
      vv.removeEventListener("scroll", read);
    };
  }, []);
  return state;
}
