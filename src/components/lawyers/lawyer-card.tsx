"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { firstConsultationLabel, toneFor, type ClientLawyer } from "@/lib/lawyers/marketplace";
import { AreaChip, LawyerAvatar, Rating, VerifiedBadge } from "./lawyer-parts";
import { RequestLawyerModal } from "./request-lawyer-modal";

/** Practice-area chips shown before "+N": one row, so every card is the same height. */
const MAX_CHIPS = 3;

/** One lawyer in the marketplace grid. View profile opens their profile; Request opens the request
 * panel in a modal (RequestLawyerModal), without leaving the list.
 * Every slot is always there and one line tall, whatever the lawyer filled in, so cards line up. */
export function LawyerCard({ lawyer }: { lawyer: ClientLawyer }) {
  const profile = `/lawyers/${lawyer.id}`;
  const [requesting, setRequesting] = useState(false);
  const place = [lawyer.firmName ?? "Independent solicitor", lawyer.town].filter(Boolean).join(" · ");
  const chips = lawyer.practiceAreas.slice(0, MAX_CHIPS);
  const more = lawyer.practiceAreas.length - chips.length;
  return (
    <article className="flex h-full w-full min-w-0 flex-col gap-4 rounded-card border border-line bg-white p-5">
      <div className="flex items-start gap-3.5">
        <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-base font-semibold">{lawyer.name}</h3>
          <p className="truncate text-[13px] text-ink-2">{place}</p>
          <div className="h-[18px]">{lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}</div>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap text-[13px] text-ink-2">
        <span className="shrink-0">
          <Rating rating={lawyer.rating} count={lawyer.reviewCount} />
        </span>
        <span className="truncate" title={[...lawyer.qualifiedJurisdictions, ...lawyer.languages].join(", ")}>
          {[lawyer.qualifiedJurisdictions.join(", "), lawyer.languages.join(", ")].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div className="flex h-[30px] flex-nowrap items-center gap-2 overflow-hidden" title={lawyer.practiceAreas.join(", ")}>
        {chips.length === 0 ? (
          <span className="text-[13px] text-ink-2">No practice areas listed</span>
        ) : (
          <>
            {chips.map((a) => (
              <AreaChip key={a}>{a}</AreaChip>
            ))}
            {more > 0 && <span className="shrink-0 text-[12.5px] text-ink-2">+{more} more</span>}
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5 rounded-input border border-line bg-subtle px-4 py-3">
        <span className="text-xs text-ink-2">First consultation</span>
        <span className="text-[15px] font-semibold">{firstConsultationLabel(lawyer)}</span>
      </div>
      <div className="mt-auto flex items-center justify-end gap-2">
        <Link href={profile} className={cn(buttonClass("soft", "sm"), "no-underline hover:text-ink")}>
          View profile
        </Link>
        <Button variant="dark" size="sm" onClick={() => setRequesting(true)}>
          Request
        </Button>
      </div>
      <RequestLawyerModal lawyer={lawyer} open={requesting} onClose={() => setRequesting(false)} />
    </article>
  );
}
