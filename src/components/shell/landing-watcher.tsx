"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { endLanding, markLanding, resetLanding } from "@/lib/landing";

/** Records the session's first page, so Cases can send an empty portfolio to the chat on landing
 * (see lib/landing.ts), and ends the landing at the first move to another page. Rendered before the
 * page, and only once the shell is ready: reading the path would otherwise block prerendering. */
export function LandingWatcher() {
  const pathname = usePathname();
  markLanding(pathname);
  const firstPage = useRef(pathname);
  useEffect(() => {
    if (pathname !== firstPage.current) endLanding();
  }, [pathname]);
  useEffect(() => resetLanding, []);
  return null;
}
