"use client";

import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/misc";

/** One section's own state. Simpler than the old per-pane overview: the intake is one job, so
 * RUNNING and FAILED are shown once, at the top of the page (see overview.tsx's banner) — a
 * section only ever needs to say "nothing here yet" (EMPTY) or "still working" (RUNNING, while
 * this section in particular has nothing to show yet) alongside its content. */
export type LocalSectionStatus = "EMPTY" | "RUNNING" | "READY";

/**
 * One section of the overview, read as part of one continuous brief rather than a stack of
 * dashboard widgets: an Eyebrow-style label (h3 — sequential under the panel's own sr-only h2,
 * see Overview) opens it, a hairline closes it, and status decides the body.
 */
export function OverviewSection({
  title,
  status,
  empty,
  running,
  children,
}: {
  title: string;
  status: LocalSectionStatus;
  /** Shown for EMPTY: what will appear here and how to get it. */
  empty: ReactNode;
  /** Shown for RUNNING in place of children, while this section has nothing yet. */
  running?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3>
        <Eyebrow>{title}</Eyebrow>
      </h3>
      {status === "EMPTY" ? (
        <p className="text-[13.5px] leading-[1.55] text-ink-2">{empty}</p>
      ) : status === "RUNNING" && running ? (
        <SectionSkeleton>{running}</SectionSkeleton>
      ) : status === "RUNNING" ? (
        <SectionSkeleton />
      ) : (
        children
      )}
    </section>
  );
}

function SectionSkeleton({ children }: { children?: ReactNode }) {
  if (children) return <>{children}</>;
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-chip" />
      <div className="h-2.5 w-[62%] animate-pulse rounded-full bg-chip" />
    </div>
  );
}
