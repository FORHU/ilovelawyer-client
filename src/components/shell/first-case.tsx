"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/site/site-provider";
import { useCasesQuery } from "@/lib/cases/queries";

const FirstCaseContext = createContext(false);

/**
 * A new client's first case: New case (/cases/new) on a story site, for an account with no case yet.
 * The page is shown in focus, without the sidebar or the app header, so the story is the only thing
 * on screen (AppShell). Once on, it stays on for this visit to New case: the story makes the case
 * part-way through, and the screen shouldn't change around it. While the cases are still loading
 * it's on too, so a new client never sees the sidebar flash in and out.
 */
export function FirstCaseProvider({ children }: { children: ReactNode }) {
  const onNewCase = usePathname() === "/cases/new";
  const story = useSite().storyIntake === "open";
  const cases = useCasesQuery();
  const [latched, setLatched] = useState(false);

  const none = cases.data?.length === 0;
  // Set during render, React's way of keeping a value from an earlier render.
  if (onNewCase && story && none && !latched) setLatched(true);
  if (!onNewCase && latched) setLatched(false);

  const first = onNewCase && story && (latched || cases.isPending);
  return <FirstCaseContext.Provider value={first}>{children}</FirstCaseContext.Provider>;
}

export function useFirstCase() {
  return useContext(FirstCaseContext);
}
