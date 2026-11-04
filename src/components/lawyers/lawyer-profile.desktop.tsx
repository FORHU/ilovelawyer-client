"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AreaChip, LawyerAvatar, REGULATORS, Stars, VerifiedBadge, monthOf } from "./lawyer-parts";
import { Eyebrow } from "@/components/ui/misc";
import { RequestPanel } from "./request-panel";
import { formatDay, firstName } from "@/lib/format";
import { firstConsultationLabel, toneFor, type ClientLawyerProfile } from "@/lib/lawyers/marketplace";

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <Eyebrow muted>{title}</Eyebrow>
        {aside && <span className="text-[13px] text-ink-2">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

export function LawyerProfileDesktop({ lawyer }: { lawyer: ClientLawyerProfile }) {
  const name = firstName(lawyer.name) ?? lawyer.name;
  const max = Math.max(...lawyer.ratingBreakdown, 1);
  const place = [lawyer.firmName ?? "Independent solicitor", lawyer.town].filter(Boolean).join(" · ");
  const credentials: [string, string][] = [
    ["Regulator", lawyer.regulator ? REGULATORS[lawyer.regulator] : "—"],
    ["Registration no.", lawyer.registrationNumber ?? "—"],
    ["Verified by ilovelawyer", lawyer.verifiedAt ? formatDay(lawyer.verifiedAt) : "—"],
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 md:px-10">
        <Link href="/lawyers" className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium">
          <ArrowLeft size={14} aria-hidden /> All lawyers
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-8">
            <header className="flex items-center gap-5">
              <LawyerAvatar lawyer={{ name: lawyer.name, tone: toneFor(lawyer.id), avatarUrl: lawyer.avatarUrl }} size={88} />
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="font-display text-[36px] leading-tight">{lawyer.name}</h1>
                <p className="text-[15px] text-ink-2">{place}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
                  {lawyer.regulator && <VerifiedBadge regulator={lawyer.regulator} />}
                  {lawyer.qualifiedJurisdictions.length > 0 && <span>{lawyer.qualifiedJurisdictions.join(", ")}</span>}
                  {lawyer.languages.length > 0 && <span>{lawyer.languages.join(", ")}</span>}
                </div>
                {!lawyer.available && <p className="text-[13px] font-medium text-ink-2">Not taking new requests right now</p>}
              </div>
            </header>

            <Section title="About">
              <p className="whitespace-pre-line text-[16px] leading-[1.65]">{lawyer.bio.trim() || `${name} hasn’t written about their practice yet.`}</p>
              {lawyer.practiceAreas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {lawyer.practiceAreas.map((a) => (
                    <AreaChip key={a}>{a}</AreaChip>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Fees">
              <div className="flex items-center justify-between rounded-card border border-line px-5 py-4 text-[15px]">
                <span className="text-ink-2">First consultation</span>
                <span className="font-semibold">{firstConsultationLabel(lawyer)}</span>
              </div>
              <p className="text-[13px] text-ink-2">Every other fee is in the quote {name} sends after reading your case, before you pay anything.</p>
            </Section>

            <Section title="Reviews" aside="From clients whose engagement has ended">
              {lawyer.rating === null ? (
                <p className="rounded-card border border-dashed border-line-input p-5 text-sm text-ink-2">No reviews yet.</p>
              ) : (
                <>
                  <div className="flex items-center gap-6 rounded-card border border-line p-5">
                    <div className="flex flex-col items-center">
                      <span className="font-display text-[44px] leading-none">{lawyer.rating.toFixed(1)}</span>
                      <span className="text-[13px] text-ink-2">
                        {lawyer.reviewCount} {lawyer.reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                      {lawyer.ratingBreakdown.map((n, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-ink-2">
                          <span className="w-2">{5 - i}</span>
                          <div className="h-1.5 flex-1 rounded-full bg-chip">
                            <div className="h-full rounded-full bg-gold" style={{ width: `${(n / max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {lawyer.reviews.map((r, i) => (
                    <div key={`${r.createdAt}-${i}`} className="flex flex-col gap-1 border-b border-line pb-4 last:border-b-0">
                      <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2">
                        <Stars n={r.rating} /> · Verified client{r.caseAreas.length > 0 && ` · ${r.caseAreas.join(", ")}`} · {monthOf(r.createdAt)}
                      </div>
                      <p className="whitespace-pre-line text-[15px] leading-[1.6]">{r.comment}</p>
                    </div>
                  ))}
                </>
              )}
            </Section>

            <Section title="Credentials">
              <div className="grid gap-3 sm:grid-cols-3">
                {credentials.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 rounded-input border border-line bg-subtle px-4 py-3.5">
                    <span className="text-[13px] text-ink-2">{k}</span>
                    <span className="text-[15px] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <RequestPanel lawyer={lawyer} id="request" className="rounded-card border border-line bg-white p-5 lg:sticky lg:top-6" />
        </div>
      </div>
    </div>
  );
}
