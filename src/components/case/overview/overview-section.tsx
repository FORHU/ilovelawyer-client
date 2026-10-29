import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/misc";

const CARD = "flex flex-col gap-3 rounded-card border border-line bg-white px-5 py-[22px] md:px-6";

/**
 * One card of the Overview's main column: a small label (h3 — sequential under the panel's own
 * sr-only h2, see Overview) over its content. A section with nothing to show yet is not drawn as an
 * empty card; Overview lists it under "Nothing here yet" instead.
 */
export function SectionCard({ title, aside, className, children }: { title: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn(CARD, className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3>
          <Eyebrow muted>{title}</Eyebrow>
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** A card of the narrower side column: a plain heading, tighter padding. */
export function AsideCard({ title, icon, className, children }: { title: string; icon?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-card border border-line bg-white px-5 py-[18px]", className)}>
      <h3 className="flex items-center gap-1.5 text-[15px] font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Stands in for a card while the overview is being written. */
export function SectionSkeleton({ title }: { title: string }) {
  return (
    <SectionCard title={title}>
      <div className="flex flex-col gap-2" aria-hidden>
        <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-chip" />
        <div className="h-2.5 w-[62%] animate-pulse rounded-full bg-chip" />
      </div>
    </SectionCard>
  );
}
