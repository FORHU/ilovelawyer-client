"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/misc";
import { formatDay, firstName } from "@/lib/format";
import { firstConsultationLabel, toneFor, type ClientLawyerProfile } from "@/lib/lawyers/marketplace";
import { AreaChip, LawyerAvatar, REGULATORS, Stars, VerifiedBadge, monthOf } from "./lawyer-parts";
import { RequestPanel } from "./request-panel";

/** A long bio folds to this many characters until "Read more". */
const BIO_FOLD = 260;
/** Reviews shown before "Show all". */
const REVIEWS_FOLD = 3;

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line px-4 py-5">
      <div className="flex flex-col gap-0.5">
        <Eyebrow muted>{title}</Eyebrow>
        {aside && <span className="text-[12.5px] text-ink-2">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** The phone's lawyer profile: who they are and what a first call costs up top, the detail in
 * sections below, and Request always in reach in a bar at the bottom. */
export function LawyerProfileMobile({ lawyer }: { lawyer: ClientLawyerProfile }) {
  // A link ending in #request wants the request open: here that is the sheet. This only mounts once
  // the lawyer has loaded in the browser, so the hash is there to read.
  const [requesting, setRequesting] = useState(() => typeof window !== "undefined" && window.location.hash === "#request");
  const [bioOpen, setBioOpen] = useState(false);
  const [allReviews, setAllReviews] = useState(false);

  const name = firstName(lawyer.name) ?? lawyer.name;
  const max = Math.max(...lawyer.ratingBreakdown, 1);
  const place = [lawyer.firmName ?? "Independent solicitor", lawyer.town].filter(Boolean).join(" · ");
  const bio = lawyer.bio.trim();
  const longBio = bio.length > BIO_FOLD;
  const reviews = allReviews ? lawyer.reviews : lawyer.reviews.slice(0, REVIEWS_FOLD);
  const credentials: [string, string][] = [
    ["Regulator", lawyer.regulator ? REGULATORS[lawyer.regulator] : "—"],
    ["Registration no.", lawyer.registrationNumber ?? "—"],
    ["Verified by ilovelawyer", lawyer.verifiedAt ? formatDay(lawyer.verifiedAt) : "—"],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Link href="/lawyers" data-no-tap className="flex min-h-11 items-center gap-1.5 px-4 text-[13px] font-medium">
          <ArrowLeft size={16} aria-hidden="true" /> All lawyers
        </Link>

        <header className="flex flex-col gap-4 px-4 pb-5 pt-1">
          <div className="flex items-center gap-3.5">
            <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} size={64} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="font-display text-[26px] leading-tight">{lawyer.name}</h1>
              <p className="text-[14px] leading-snug text-ink-2">{place}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
            {lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}
            {lawyer.qualifiedJurisdictions.length > 0 && <span>{lawyer.qualifiedJurisdictions.join(", ")}</span>}
            {lawyer.languages.length > 0 && <span>{lawyer.languages.join(", ")}</span>}
          </div>
          <dl className="grid grid-cols-2 divide-x divide-line rounded-card border border-line bg-subtle">
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-[12px] text-ink-2">Rating</dt>
              <dd className="flex items-center gap-1 text-[15px] font-semibold">
                {lawyer.rating === null ? (
                  <span className="text-[14px] font-normal text-ink-2">No reviews yet</span>
                ) : (
                  <>
                    <Star size={14} className="fill-gold text-gold" aria-hidden="true" />
                    {lawyer.rating.toFixed(1)}
                    <span className="text-[12.5px] font-normal text-ink-2">({lawyer.reviewCount})</span>
                  </>
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-[12px] text-ink-2">First consultation</dt>
              <dd className="text-[15px] font-semibold">{firstConsultationLabel(lawyer)}</dd>
            </div>
          </dl>
          {!lawyer.available && <p className="text-[13px] font-medium text-ink-2">Not taking new requests right now</p>}
        </header>

        <Section title="About">
          <p className={`whitespace-pre-line text-[15px] leading-[1.6] ${longBio && !bioOpen ? "line-clamp-5" : ""}`}>
            {bio || `${name} hasn’t written about their practice yet.`}
          </p>
          {longBio && (
            <button
              type="button"
              aria-expanded={bioOpen}
              onClick={() => setBioOpen((o) => !o)}
              data-no-tap
              className="flex min-h-11 items-center self-start text-[14px] font-medium text-gold"
            >
              {bioOpen ? "Show less" : "Read more"}
            </button>
          )}
          {lawyer.practiceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lawyer.practiceAreas.map((a) => (
                <AreaChip key={a}>{a}</AreaChip>
              ))}
            </div>
          )}
        </Section>

        <Section title="Fees">
          <p className="text-[14px] leading-[1.55] text-ink-2">Every other fee is in the quote {name} sends after reading your case, before you pay anything.</p>
        </Section>

        <Section title="Reviews" aside="From clients whose engagement has ended">
          {lawyer.rating === null ? (
            <p className="rounded-card border border-dashed border-line-input p-4 text-[14px] text-ink-2">No reviews yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-5 rounded-card border border-line p-4">
                <div className="flex flex-col items-center">
                  <span className="font-display text-[40px] leading-none">{lawyer.rating.toFixed(1)}</span>
                  <span className="text-[12.5px] text-ink-2">
                    {lawyer.reviewCount} {lawyer.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {lawyer.ratingBreakdown.map((n, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-ink-2">
                      <span className="w-2">{5 - i}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-chip">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${(n / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {reviews.map((r, i) => (
                <div key={`${r.createdAt}-${i}`} className="flex flex-col gap-1 border-b border-line pb-4 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-2">
                    <Stars n={r.rating} /> · Verified client{r.caseAreas.length > 0 && ` · ${r.caseAreas.join(", ")}`} · {monthOf(r.createdAt)}
                  </div>
                  <p className="whitespace-pre-line text-[14.5px] leading-[1.6]">{r.comment}</p>
                </div>
              ))}
              {lawyer.reviews.length > REVIEWS_FOLD && (
                <Button variant="soft" size="lg" className="w-full" onClick={() => setAllReviews((o) => !o)} aria-expanded={allReviews}>
                  {allReviews ? "Show fewer reviews" : `Show all ${lawyer.reviews.length} reviews`}
                </Button>
              )}
            </>
          )}
        </Section>

        <Section title="Credentials">
          <dl className="overflow-hidden rounded-card border border-line">
            {credentials.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0">
                <dt className="shrink-0 text-[13px] text-ink-2">{k}</dt>
                <dd className="text-right text-[14px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      {/* Always in reach: the screen above scrolls, this doesn't. */}
      <div className="flex shrink-0 items-center gap-3 border-t border-line bg-white px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[12px] text-ink-2">First consultation</span>
          <span className="truncate text-[16px] font-semibold">{firstConsultationLabel(lawyer)}</span>
        </div>
        <Button variant="dark" size="xl" className="ml-auto min-w-0 flex-1 !text-[14px]" onClick={() => setRequesting(true)} data-no-tap>
          <span className="truncate">Request {name}</span>
        </Button>
      </div>

      <BottomSheet open={requesting} onClose={() => setRequesting(false)} title={`Request ${lawyer.name}`}>
        <div className="px-3 pb-2">
          <RequestPanel lawyer={lawyer} onLeave={() => setRequesting(false)} />
        </div>
      </BottomSheet>
    </div>
  );
}
