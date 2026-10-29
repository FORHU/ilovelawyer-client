"use client";

import { useState } from "react";
import { Check, CircleAlert, Radar, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import { LawyerMessages } from "@/components/case/lawyer-messages";
import { CLIENT_REQUEST_STAGES, type ClientRequestStage } from "@/lib/client-handoff";
import {
  clientRequestStage,
  useConfirmLawyerRequestMutation,
  useDeclineLawyerRequestMutation,
  useEndLawyerRequestMutation,
  useWithdrawLawyerRequestMutation,
  type LawyerOffer,
  type LawyerRequest,
} from "@/lib/lawyer-requests/api";
import { money } from "@/lib/pricing";
import type { Case } from "@/lib/types";

// The main path's five stages (CLIENT_REQUEST_STAGES also has "expired" and "withdrawn", shown
// as their own one-off cards below instead of on this line — withdrawn never reaches this tab at
// all, since [id]/page.tsx drops straight back to the ordinary case view for it).
const MAIN_STAGES = CLIENT_REQUEST_STAGES.filter((s): s is Exclude<ClientRequestStage, "expired" | "withdrawn"> => s !== "expired" && s !== "withdrawn");

/** Up to 3 lawyers can take up a request and quote (ilovelawyer-api, several lawyers). */
const MAX_LAWYERS = 3;

function stageTitle(stage: (typeof MAIN_STAGES)[number], request: LawyerRequest): string {
  const on = request.lawyers.length;
  const quoted = request.lawyers.filter((l) => l.quote).length;
  switch (stage) {
    case "waiting":
      return "Finding your lawyer";
    case "review":
      return on > 1 ? `${on} lawyers are reviewing your case` : "A lawyer is reviewing your case";
    case "accepted":
      return quoted > 1 ? `${quoted} quotes received` : "Quote received";
    case "ongoing":
      return "Lawyer confirmed";
    case "done":
      return "Closed";
  }
}

/** "9:00 am on Friday 6 November": the request closes at that moment, not at the end of the day. */
function pickByTime(iso: string) {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${time} on ${at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`;
}

/** The SRA's referral disclosure: shown before any Hire button, since hiring acknowledges it. */
function ReferralDisclosure({ text }: { text: string }) {
  return <div className="rounded-input border border-line bg-subtle px-4 py-3 text-xs leading-[1.6] text-ink-2">{text}</div>;
}

/** The five-stage progress line (#19). Past stages check off; the current one is highlighted;
 * later ones are dimmed. */
function StageTimeline({ stage }: { stage: (typeof MAIN_STAGES)[number] }) {
  const current = MAIN_STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1.5" role="list" aria-label="Request progress">
      {MAIN_STAGES.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1.5" role="listitem">
          <div
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
              i < current ? "border-ink bg-ink text-white" : i === current ? "border-gold bg-gold text-white" : "border-line text-muted",
            )}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <Check size={12} /> : i + 1}
          </div>
          {i < MAIN_STAGES.length - 1 && <div className={cn("h-px flex-1", i < current ? "bg-ink" : "bg-line")} />}
        </div>
      ))}
    </div>
  );
}

const CARD = "flex flex-col gap-3 rounded-modal border border-line p-5";
const LABEL = "text-[10px] font-semibold uppercase tracking-[1px] text-muted";

function WithdrawButton({ requestId, caseId, disabled }: { requestId: string; caseId: string; disabled?: boolean }) {
  const withdraw = useWithdrawLawyerRequestMutation(caseId);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-1.5">
      {error && <ErrorBox message={error} />}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || withdraw.isPending}
        onClick={() => {
          setError("");
          withdraw.mutate(requestId, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't withdraw. Try again.") });
        }}
      >
        {withdraw.isPending ? "Withdrawing…" : "Withdraw request"}
      </Button>
    </div>
  );
}

function LawyerProfileCard({ lawyer }: { lawyer: NonNullable<LawyerRequest["lawyer"]> }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
          {lawyer.name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink">{lawyer.name}</div>
          <div className="truncate text-xs text-muted">
            {lawyer.firmName ?? "Solo practitioner"} · {lawyer.regulator} {lawyer.registrationNumber}
          </div>
        </div>
      </div>
      {lawyer.bio && <p className="text-[13px] leading-[1.6] text-ink-2">{lawyer.bio}</p>}
      {lawyer.firstConsultationFee && (
        <div className="text-xs text-muted">First consultation fee: {money(lawyer.firstConsultationFee)}</div>
      )}
    </div>
  );
}

function QuoteCard({ quote }: { quote: NonNullable<LawyerOffer["quote"]> }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3">
      <div className={LABEL}>{quote.type === "FIXED_FEE" ? "Fixed fee" : "First consultation"}</div>
      <div className="font-display text-[22px] tracking-[-0.02em] text-ink">{money(quote.amount)}</div>
      {quote.message && <p className="text-[13px] leading-[1.6] text-ink-2">{quote.message}</p>}
    </div>
  );
}

/**
 * The quotes (several lawyers, ilovelawyer-api phase 5): each lawyer on the request with their quote,
 * or a note that they're still reviewing. The client hires one, which tells the others; or declines
 * one, which frees their place for another lawyer.
 */
function QuoteStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const confirm = useConfirmLawyerRequestMutation(c.id);
  const decline = useDeclineLawyerRequestMutation(c.id);
  const [error, setError] = useState("");
  const confirmed = request.status === "CONFIRMED";
  const busy = confirm.isPending || decline.isPending;

  if (confirmed) {
    return (
      <div className="flex flex-col gap-4">
        {request.lawyer && <LawyerProfileCard lawyer={request.lawyer} />}
        <div className="flex items-center gap-2 rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">
          <Check size={14} className="text-success" />
          Confirmed — paying the lawyer&apos;s introduction fee.
        </div>
        {request.referralDisclosure && <ReferralDisclosure text={request.referralDisclosure} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {request.pickByAt && (
        <div className="text-[13px] text-ink-2">
          Choose a lawyer by {pickByTime(request.pickByAt)}. If you don&apos;t, this request closes and you can ask again.
        </div>
      )}

      {/* Above the offers, so it's read before any Hire, which acknowledges it. */}
      {request.referralDisclosure && <ReferralDisclosure text={request.referralDisclosure} />}

      {request.lawyers.map((offer) => (
        <div key={offer.claimId} className="flex flex-col gap-3">
          <LawyerProfileCard lawyer={offer.lawyer} />
          <div className={CARD}>
            {offer.quote ? (
              <>
                <QuoteCard quote={offer.quote} />
                <div className="flex gap-2.5">
                  <Button
                    size="md"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      confirm.mutate({ id: request.id, claimId: offer.claimId }, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't confirm. Try again.") });
                    }}
                  >
                    {confirm.isPending && confirm.variables?.claimId === offer.claimId ? "Confirming…" : `Hire ${offer.lawyer.name}`}
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      decline.mutate({ id: request.id, claimId: offer.claimId }, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't decline. Try again.") });
                    }}
                  >
                    {decline.isPending && decline.variables?.claimId === offer.claimId ? "Declining…" : "Decline this quote"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-[13px] text-ink-2">Reviewing your case. They&apos;ll send a quote within 24 hours.</div>
            )}
          </div>
        </div>
      ))}

      {(request.openToLawyers ?? request.lawyers.length < MAX_LAWYERS) && (
        <div className="text-xs text-muted">Up to {MAX_LAWYERS} lawyers can send you a quote. Others may still take up your request.</div>
      )}


      {error && <ErrorBox message={error} />}
      <WithdrawButton requestId={request.id} caseId={c.id} disabled={busy} />
    </div>
  );
}

function EngagedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const end = useEndLawyerRequestMutation(c.id);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-4">
      {request.lawyer && <LawyerProfileCard lawyer={request.lawyer} />}
      <LawyerMessages c={c} requestId={request.id} lawyerName={request.lawyer?.name ?? "your lawyer"} closed={false} />
      {error && <ErrorBox message={error} />}
      <Button
        variant="ghost"
        size="sm"
        disabled={end.isPending}
        onClick={() => {
          if (!window.confirm("End this engagement? Your lawyer will lose access to this case.")) return;
          setError("");
          end.mutate({ id: request.id }, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't end the engagement. Try again.") });
        }}
      >
        {end.isPending ? "Ending…" : "End engagement"}
      </Button>
    </div>
  );
}

function ClosedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={cn(CARD, "flex-row items-center gap-3")}>
        <Check size={16} className="text-success" aria-hidden="true" />
        <div className="text-[13px] text-ink-2">
          {request.closedBy === "LAWYER" ? "Your lawyer closed this engagement." : "You ended this engagement."}
        </div>
      </div>
      {/* The thread stays readable after the engagement ends (ilovelawyer-api#517). */}
      {request.lawyer && <LawyerMessages c={c} requestId={request.id} lawyerName={request.lawyer.name} closed />}
    </div>
  );
}

function ExpiredStage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-line text-danger">
        <CircleAlert size={20} />
      </div>
      <div className="font-display text-[22px] tracking-[-0.02em]">No lawyer found</div>
      <div className="max-w-[420px] text-[13px] leading-[1.6] text-ink-2">
        No lawyer took up this request in time, or no quote was chosen within 7 days. You haven&apos;t been charged for it, and you can
        ask for a lawyer on this case again any time.
      </div>
    </div>
  );
}

export function LawyerTab({ c, request }: { c: Case; request: LawyerRequest }) {
  const stage = clientRequestStage(request.status);

  if (stage === "expired") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <ExpiredStage />
      </div>
    );
  }

  // [id]/page.tsx filters "withdrawn" out before mounting this tab at all — this is just so the
  // rest of the function can narrow `stage` to the five main ones without TS complaining.
  if (stage === "withdrawn") return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 md:px-10">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
        <StageTimeline stage={stage} />
        <div className="font-display text-[20px] tracking-[-0.02em] text-ink">{stageTitle(stage, request)}</div>

        {stage === "waiting" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">
              <Radar size={16} className="shrink-0 text-gold" aria-hidden="true" />
              Verified UK lawyers are reviewing an anonymised summary of your case. Up to {MAX_LAWYERS} can take it up and send you a quote.
            </div>
            <WithdrawButton requestId={request.id} caseId={c.id} />
          </div>
        )}

        {stage === "review" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">
              <Scale size={16} className="shrink-0 text-gold" aria-hidden="true" />
              {request.lawyers.length > 1
                ? `${request.lawyers.length} lawyers have taken up your case. Each checks for a conflict and sends you a quote within 24 hours.`
                : "A lawyer has taken up your case for a conflict check and will send a quote within 24 hours."}
            </div>
            <WithdrawButton requestId={request.id} caseId={c.id} />
          </div>
        )}

        {stage === "accepted" && <QuoteStage c={c} request={request} />}
        {stage === "ongoing" && <EngagedStage c={c} request={request} />}
        {stage === "done" && <ClosedStage c={c} request={request} />}
      </div>
    </div>
  );
}
