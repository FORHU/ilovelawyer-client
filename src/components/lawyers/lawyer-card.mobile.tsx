"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { firstConsultationLabel, toneFor, type ClientLawyer } from "@/lib/lawyers/marketplace";
import { AreaChip, LawyerAvatar, Rating, VerifiedBadge } from "./lawyer-parts";
import { RequestLawyerModal } from "./request-lawyer-modal";

/** Practice-area chips shown before "+N": one row, so cards stay short and the same height. */
const MAX_CHIPS = 2;

/** One lawyer on a phone. The whole card opens the profile (the name is the link, stretched over
 * the card); Request is its own button on top. Fewer lines than the desktop card, so more
 * lawyers show per screen. */
export function LawyerCardMobile({ lawyer }: { lawyer: ClientLawyer }) {
  const [requesting, setRequesting] = useState(false);
  const place = [lawyer.firmName ?? "Independent solicitor", lawyer.town].filter(Boolean).join(" · ");
  const chips = lawyer.practiceAreas.slice(0, MAX_CHIPS);
  const more = lawyer.practiceAreas.length - chips.length;
  return (
    <article className="relative flex flex-col gap-3 rounded-card border border-line bg-white p-4 active:bg-subtle">
      <div className="flex items-start gap-3">
        <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-[16px] font-semibold leading-snug">
            <Link href={`/lawyers/${lawyer.id}`} className="text-ink no-underline after:absolute after:inset-0 after:content-[''] hover:text-ink">
              {lawyer.name}
              <span className="sr-only">, view profile</span>
            </Link>
          </h2>
          <p className="truncate text-[13px] text-ink-2">{place}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <Rating rating={lawyer.rating} count={lawyer.reviewCount} />
            {lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-nowrap items-center gap-2 overflow-hidden">
          {chips.map((a) => (
            <AreaChip key={a}>{a}</AreaChip>
          ))}
          {more > 0 && <span className="shrink-0 text-[12.5px] text-ink-2">+{more} more</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[12px] text-ink-2">First consultation</span>
          <span className="truncate text-[15px] font-semibold">{firstConsultationLabel(lawyer)}</span>
        </div>
        {/* Above the stretched profile link, so it takes its own taps. */}
        <Button variant="dark" size="lg" className="relative z-10 shrink-0" onClick={() => setRequesting(true)} data-no-tap>
          Request
        </Button>
      </div>
      <RequestLawyerModal lawyer={lawyer} open={requesting} onClose={() => setRequesting(false)} />
    </article>
  );
}
