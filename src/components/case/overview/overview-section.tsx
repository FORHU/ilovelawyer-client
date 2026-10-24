"use client";

import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Eyebrow } from "@/components/ui/misc";
import type { SectionStatus } from "@/lib/types";

const CHIP_TEXT: Partial<Record<SectionStatus, string>> = {
  RUNNING: "Working…",
  FAILED: "Couldn't update",
};

/**
 * One section of the overview, read as part of one continuous brief rather than a stack of
 * dashboard widgets: an Eyebrow-style label (h3 — sequential under the panel's own sr-only h2,
 * see Overview) opens it, a hairline closes it, and status decides the body. EMPTY and RUNNING
 * take their own copy (what will show up, and how far along it is); READY and FAILED render
 * `children` — FAILED alongside the last content that's still good, never replacing it, with a
 * Try again button that re-runs the whole overview (one job writes every section, so there's no
 * single-section retry).
 */
export function OverviewSection({
  title,
  status,
  empty,
  running,
  onRetry,
  retrying,
  children,
}: {
  title: string;
  status: SectionStatus;
  /** Shown for EMPTY: what will appear here and how to get it. */
  empty: ReactNode;
  /** Shown for RUNNING in place of children, while this section has nothing yet. */
  running?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  children: ReactNode;
}) {
  const chip = CHIP_TEXT[status];
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-2">
        <h3 className="min-w-0 flex-1">
          <Eyebrow>{title}</Eyebrow>
        </h3>
        {chip && (
          <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-ink-2">{chip}</span>
        )}
      </div>
      {status === "EMPTY" ? (
        <p className="text-[13.5px] leading-[1.55] text-ink-2">{empty}</p>
      ) : status === "RUNNING" && running ? (
        <SectionSkeleton>{running}</SectionSkeleton>
      ) : status === "RUNNING" ? (
        <SectionSkeleton />
      ) : status === "FAILED" ? (
        <div className="flex flex-col gap-3">
          {children}
          <div className="flex flex-wrap items-center gap-2.5 rounded-card border border-error-line bg-error-bg px-3.5 py-2.5 text-[13px] text-error-ink">
            <span className="min-w-0 flex-1">We couldn&apos;t update this part. The rest of your overview is fine.</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink disabled:opacity-40"
              >
                <RotateCw size={12} />
                Try again
              </button>
            )}
          </div>
        </div>
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
