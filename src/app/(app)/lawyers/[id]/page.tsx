"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Star } from "lucide-react";
import { AreaChip, LawyerAvatar, VerifiedBadge } from "@/components/lawyers/lawyer-parts";
import { ErrorBox } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Eyebrow } from "@/components/ui/misc";
import { useCaseAvailability } from "@/components/lawyers/use-case-availability";
import { useCasesQuery } from "@/lib/cases/queries";
import { formatDay, firstName } from "@/lib/format";
import { useLawyerRequestForm } from "@/lib/lawyer-requests/api";
import {
  consultationLabel,
  DIRECT_REQUEST_AVAILABLE,
  useMarketplaceCase,
  range,
  useLawyerQuery,
  useRequestLawyerMutation,
  type MarketplaceLawyer,
} from "@/lib/lawyers/marketplace";

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} out of 5`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={12} className="fill-gold text-gold" aria-hidden />
      ))}
    </span>
  );
}

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

function RequestPanel({ lawyer, onSent }: { lawyer: MarketplaceLawyer; onSent: (caseId: string) => void }) {
  const { data: cases = [] } = useCasesQuery();
  const picked = useMarketplaceCase((s) => s.caseId);
  const request = useRequestLawyerMutation();
  const [chosen, setChosen] = useState<string | null>(null);
  // The case picked on the marketplace, if it still exists, else the first.
  const caseId = chosen ?? (cases.some((c) => c.id === picked) ? picked : null) ?? cases[0]?.id ?? null;
  const availability = useCaseAvailability(caseId);
  const name = firstName(lawyer.name) ?? lawyer.name;

  return (
    <aside id="request" className="flex flex-col gap-4 rounded-card border border-line bg-white p-5 lg:sticky lg:top-6">
      <dl className="flex flex-col text-[15px]">
        <div className="flex justify-between border-b border-line py-2.5">
          <dt className="text-ink-2">First consultation</dt>
          <dd className="font-semibold">{consultationLabel(lawyer)}</dd>
        </div>
        <div className="flex justify-between border-b border-line py-2.5">
          <dt className="text-ink-2">Fixed fees</dt>
          <dd className="font-semibold">{lawyer.fixedFees ? range(lawyer.fixedFees) : "—"}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-ink-2">Hourly</dt>
          <dd className="font-semibold">{lawyer.hourly ? range(lawyer.hourly) : "—"}</dd>
        </div>
      </dl>

      {cases.length === 0 ? (
        <p className="text-[13px] leading-[1.6] text-ink-2">
          You need a case to send a request. <Link href="/cases/new">Start one</Link>, then come back.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="request-case" className="text-xs font-semibold text-ink-2">
              For which case
            </label>
            <select
              id="request-case"
              value={caseId ?? ""}
              onChange={(e) => setChosen(e.target.value)}
              className="h-11 rounded-input border border-line-input bg-white px-3.5 text-sm text-ink outline-none focus:border-ink-2"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          {availability.reason && <p className="text-[13px] leading-[1.6] text-ink-2">{availability.reason}</p>}
          {!DIRECT_REQUEST_AVAILABLE && (
            <p className="text-[13px] leading-[1.6] text-ink-2">Requesting {name} directly isn’t available yet. Use “Let us match me instead” below.</p>
          )}
          {request.error && <ErrorBox message="Couldn't send your request. Try again." />}
          <Button
            variant="dark"
            size="xl"
            className="w-full !text-[14px]"
            disabled={!DIRECT_REQUEST_AVAILABLE || !availability.canRequest || request.isPending}
            onClick={() => caseId && request.mutate({ lawyerId: lawyer.id, caseId }, { onSuccess: () => onSent(caseId) })}
          >
            {request.isPending ? "Sending…" : `Request ${name}`}
          </Button>
          <Button variant="soft" size="lg" className="w-full" disabled={!availability.canRequest} onClick={() => caseId && useLawyerRequestForm.getState().openFor(caseId)}>
            Let us match me instead
          </Button>
        </>
      )}
      <p className="text-[12.5px] leading-[1.6] text-ink-2">
        Only {name} gets this request. They’ll check for conflicts and send a quote within 24 hours. If they can’t take it, we’ll offer to match you with others.
      </p>
    </aside>
  );
}

export default function LawyerProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: lawyer, isLoading } = useLawyerQuery(id);
  const [sentFor, setSentFor] = useState<string | null>(null);

  // The card's "Request" link ends in #request, which isn't on the page until the lawyer loads.
  useEffect(() => {
    if (lawyer && window.location.hash === "#request") document.getElementById("request")?.scrollIntoView();
  }, [lawyer]);

  if (isLoading) return <div className="flex-1" aria-busy />;

  if (!lawyer) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-start gap-3 px-6 py-16">
        <h1 className="font-display text-[28px]">Lawyer not found</h1>
        <p className="text-sm text-ink-2">They may no longer be listed.</p>
        <Link href="/lawyers" className="text-sm font-medium">
          Back to all lawyers
        </Link>
      </div>
    );
  }

  const name = firstName(lawyer.name) ?? lawyer.name;
  const max = Math.max(...lawyer.ratingBreakdown, 1);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-8 md:px-10">
        <Link href="/lawyers" className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium">
          <ArrowLeft size={14} aria-hidden /> All lawyers
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-8">
            <header className="flex items-center gap-5">
              <LawyerAvatar lawyer={lawyer} size={88} />
              <div className="flex flex-col gap-1">
                <h1 className="font-display text-[36px] leading-tight">{lawyer.name}</h1>
                <p className="text-[15px] text-ink-2">
                  {lawyer.title}
                  {lawyer.firmName ? ` · ${lawyer.firmName}` : ""} · {lawyer.town}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
                  <VerifiedBadge regulator={lawyer.regulator} />
                  <span>{lawyer.jurisdictions.join(", ")}</span>
                  <span>{lawyer.languages.join(", ")}</span>
                  <span>Usually replies in {lawyer.repliesIn}</span>
                </div>
              </div>
            </header>

            <Section title="About">
              <p className="text-[16px] leading-[1.65]">{lawyer.bio}</p>
              <div className="flex flex-wrap gap-2">
                {lawyer.specialisms.map((s) => (
                  <AreaChip key={s}>{s}</AreaChip>
                ))}
              </div>
            </Section>

            <Section title="Services and fees">
              <div className="overflow-hidden rounded-card border border-line">
                <div className="hidden grid-cols-[1fr_140px_140px] gap-4 border-b border-line bg-subtle px-5 py-3 text-[10px] font-semibold uppercase tracking-[1px] text-ink-2 sm:grid">
                  <span>Service</span>
                  <span>How it’s charged</span>
                  <span className="text-right">Price</span>
                </div>
                {lawyer.services.map((s) => (
                  <div key={s.name} className="grid gap-1 border-b border-line px-5 py-3.5 text-[14.5px] last:border-b-0 sm:grid-cols-[1fr_140px_140px] sm:gap-4">
                    <span>{s.name}</span>
                    <span className="text-ink-2">{s.charge}</span>
                    <span className="font-semibold sm:text-right">
                      {s.price.max === 0 ? "Free" : range(s.price)}
                      {s.charge === "Hourly" && "/hr"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-ink-2">Prices exclude VAT. Your actual price is in the quote {name} sends after reading your case.</p>
            </Section>

            <Section title="Reviews" aside="From clients whose engagement has ended">
              <div className="flex items-center gap-6 rounded-card border border-line p-5">
                <div className="flex flex-col items-center">
                  <span className="font-display text-[44px] leading-none">{lawyer.rating.toFixed(1)}</span>
                  <span className="text-[13px] text-ink-2">{lawyer.reviewCount} reviews</span>
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
              {lawyer.reviews.map((r) => (
                <div key={r.text} className="flex flex-col gap-1 border-b border-line pb-4 last:border-b-0">
                  <div className="flex items-center gap-2 text-[13px] text-ink-2">
                    <Stars n={r.rating} /> · Verified client · {r.matter} · {r.month}
                  </div>
                  <p className="text-[15px] leading-[1.6]">{r.text}</p>
                </div>
              ))}
            </Section>

            <Section title="Credentials">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Regulator", lawyer.regulator],
                  ["Registration no.", lawyer.registrationNumber],
                  ["Verified by ilovelawyer", formatDay(lawyer.verifiedAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 rounded-input border border-line bg-subtle px-4 py-3.5">
                    <span className="text-[13px] text-ink-2">{k}</span>
                    <span className="text-[15px] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <RequestPanel lawyer={lawyer} onSent={setSentFor} />
        </div>
      </div>

      <Modal open={!!sentFor} onClose={() => setSentFor(null)} title={`Request sent to ${name}`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-success-bg text-success-ink">
            <Check size={24} aria-hidden />
          </div>
          <p className="text-sm leading-[1.6] text-ink-2">
            {name} will reply with a quote within 24 hours. You’ll see it on your case’s Lawyer tab, and we’ll email you.
          </p>
          <div className="flex gap-2">
            <Button variant="dark" size="lg" onClick={() => router.push(`/cases/${sentFor}`)}>
              Go to my case
            </Button>
            <Button variant="soft" size="lg" onClick={() => setSentFor(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
