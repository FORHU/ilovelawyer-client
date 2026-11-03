"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { endLanding, markLanding } from "@/lib/landing";

/** Records the session's first page, so Cases can send an empty portfolio to the chat on landing
 * (see lib/landing.ts), and ends the landing at the first move to another page. Rendered before the
 * page, and only once the shell is ready: reading the path would otherwise block prerendering.
 * The landing isn't cleared when this unmounts (StrictMode mounts, unmounts and mounts again in
 * dev): signing out clears it. */
export function LandingWatcher() {
  const pathname = usePathname();
  // Set while rendering so the page below sees it on its first render; only the first call counts.
  markLanding(pathname);
  const firstPage = useRef(pathname);
  useEffect(() => {
    if (pathname !== firstPage.current) endLanding();
  }, [pathname]);
  return null;
}
