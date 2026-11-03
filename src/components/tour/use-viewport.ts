"use client";

import { useEffect, useState } from "react";

/** Tailwind's `md`: below it the app is the phone layout. */
const PHONE_MAX = 768;

/** The window's size, kept current as the phone's address bar shows and hides, the keyboard opens
 * or the window is resized. 0 until mounted. */
export function useViewport() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const read = () => setSize((prev) => (prev.w === innerWidth && prev.h === innerHeight ? prev : { w: innerWidth, h: innerHeight }));
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, []);
  return { ...size, phone: size.w > 0 && size.w < PHONE_MAX };
}
