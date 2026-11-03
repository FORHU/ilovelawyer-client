"use client";

import { useEffect } from "react";

/** Stops the page behind an open sheet from scrolling, and puts it back as it was. */
export function useBodyScrollLock() {
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
}
