"use client";

import Link from "next/link";
import { useDevice } from "@/components/device/device-provider";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { Modal } from "@/components/ui/modal";
import { toneFor, type ClientLawyer } from "@/lib/lawyers/marketplace";
import { AreaChip, LawyerAvatar, Rating, VerifiedBadge } from "./lawyer-parts";
import { RequestPanel } from "./request-panel";

/** Practice-area chips shown before "+N more". */
const MAX_CHIPS = 3;

/** The marketplace card's Request: who the lawyer is in brief, and the profile's request panel, so
 * the client can ask them without leaving the list. The full profile is a link away. On a phone it
 * is a bottom sheet with the lawyer cut down to a line or two, so the request is on screen at once. */
export function RequestLawyerModal({ lawyer, open, onClose }: { lawyer: ClientLawyer; open: boolean; onClose: () => void }) {
  const place = [lawyer.firmName ?? "Independent solicitor", lawyer.town].filter(Boolean).join(" · ");
  const chips = lawyer.practiceAreas.slice(0, MAX_CHIPS);
  const more = lawyer.practiceAreas.length - chips.length;
  const profile = `/lawyers/${lawyer.id}`;
  const mobile = useDevice() === "mobile";

  if (mobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title={`Request ${lawyer.name}`}>
        <div className="flex flex-col gap-4 px-3 pb-2">
          <div className="flex items-center gap-3">
            <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} size={44} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[13px] text-ink-2">{place}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <Rating rating={lawyer.rating} count={lawyer.reviewCount} />
                {lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}
              </div>
              <Link href={profile} onClick={onClose} className="self-start text-[13px] font-medium">
                View full profile
              </Link>
            </div>
          </div>
          <RequestPanel lawyer={lawyer} onLeave={onClose} />
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request ${lawyer.name}`} size="xl">
      {/* Side by side from md, so the whole thing fits on screen without scrolling. */}
      <div className="grid items-start gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-card border border-line p-4">
          <div className="flex items-start gap-3.5">
            <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} size={52} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[15px] font-semibold">{lawyer.name}</p>
              <p className="truncate text-[13px] text-ink-2">{place}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}
                <Rating rating={lawyer.rating} count={lawyer.reviewCount} />
              </div>
            </div>
          </div>
          {(lawyer.qualifiedJurisdictions.length > 0 || lawyer.languages.length > 0) && (
            <p className="text-[13px] text-ink-2">{[lawyer.qualifiedJurisdictions.join(", "), lawyer.languages.join(", ")].filter(Boolean).join(" · ")}</p>
          )}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((a) => (
                <AreaChip key={a}>{a}</AreaChip>
              ))}
              {more > 0 && <span className="text-[12.5px] text-ink-2">+{more} more</span>}
            </div>
          )}
          {lawyer.bio.trim() && <p className="line-clamp-5 text-[13.5px] leading-[1.6] text-ink">{lawyer.bio.trim()}</p>}
          <Link href={profile} onClick={onClose} className="self-start text-[13px] font-medium">
            View full profile
          </Link>
        </div>

        <RequestPanel lawyer={lawyer} onLeave={onClose} />
      </div>
    </Modal>
  );
}
