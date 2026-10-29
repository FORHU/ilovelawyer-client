"use client";

import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Avatar, Eyebrow, initialsOf } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { LawyerMessages } from "@/components/case/lawyer-messages";
import {
  clientRequestStage,
  useConfirmLawyerRequestMutation,
  useDeclineLawyerRequestMutation,
  useEligibilityQuery,
  useEndLawyerRequestMutation,
  useLawyerRequestForm,
  useWithdrawLawyerRequestMutation,
  type LawyerRequest,
} from "@/lib/lawyer-requests/api";
import { money } from "@/lib/pricing";
import type { Case } from "@/lib/types";

/** Where a request sits on the five-step line. "sent" is its own step (the brief is being written
 * before any lawyer sees it), and "payfail" is CONFIRMED: the client has chosen, the lawyer's side
 * isn't open yet. */
type Phase = "sent" | "finding" | "reviewing" | "quote" | "finalising" | "engaged" | "closed" | "expired";

function phaseOf(request: LawyerRequest): Phase {
  switch (request.status) {
    case "REQUESTED":
      return "sent";
    case "ROUTED":
      return "finding";
    case "CLAIMED":
      return "reviewing";
    case "QUOTED":
      return "quote";
    case "CONFIRMED":
      return "finalising";
    case "ENGAGED":
      return "engaged";
    case "CLOSED":
      return "closed";
    case "EXPIRED":
    case "WITHDRAWN":
      return "expired";
  }
}

/** How many steps are behind the request. */
const POSITION: Record<Phase, number> = { sent: 0, finding: 1, reviewing: 2, quote: 3, finalising: 4, engaged: 4, closed: 5, expired: 1 };

/** "29 Oct, 10:42" */
function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

interface Step {
  label: string;
  sub: string;
  time?: string;
  expect?: string;
}

function stepsFor(request: LawyerRequest, phase: Phase): Step[] {
  const first = request.lawyer?.name.split(" ")[0];
  return [
    { label: "Request sent", sub: "Anonymised summary of your overview", time: when(request.createdAt), expect: "Takes about a minute" },
    {
      label: phase === "expired" ? "No lawyer picked it up" : "Finding a lawyer",
      sub: "Sent to matching lawyers",
      expect: phase === "expired" ? "Ended after 48 hours" : "Most are picked up within a day",
    },
    { label: "A lawyer is reviewing", sub: "Conflict check, then a quote" },
    { label: "Review the quote", sub: "Confirm or decline — you pay the lawyer, not us" },
    {
      label: phase === "finalising" ? `Finalising${first ? ` with ${first}` : ""}` : "Working with your lawyer",
      sub: "Messages, and read-only access to your case",
      time: request.engagedAt ? (request.closedAt ? `${day(request.engagedAt)} – ${day(request.closedAt)}` : when(request.engagedAt)) : undefined,
      expect: phase === "finalising" ? "Usually takes a few minutes" : request.engagedAt ? `Started ${day(request.engagedAt)}` : undefined,
    },
  ];
}

function StepDot({ n, state }: { n: number; state: "done" | "current" | "fail" | "upcoming" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "box-border flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        state === "done" && "bg-ink text-white",
        state === "current" && "border-2 border-gold bg-warn-bg text-gold shadow-[0_0_0_4px_rgb(138_98_0/0.12)]",
        state === "fail" && "border-2 border-error bg-error-bg text-error",
        state === "upcoming" && "border-[1.5px] border-line-input bg-white text-ink-2",
      )}
    >
      {state === "done" ? <Check size={13} strokeWidth={3} /> : state === "fail" ? "!" : n}
    </span>
  );
}

/** The five-step line (#19): done steps check off, the current one is ringed and says what to
 * expect, later ones are dimmed. A request nobody picked up fails on step two. */
function RequestSteps({ request, phase }: { request: LawyerRequest; phase: Phase }) {
  const steps = stepsFor(request, phase);
  const pos = POSITION[phase];
  const failed = phase === "expired";
  return (
    <ol className="flex flex-col" aria-label="Request progress">
      {steps.map((st, i) => {
        const state = i < pos ? "done" : i === pos ? (failed ? "fail" : "current") : "upcoming";
        const last = i === steps.length - 1;
        // Closed is the end of the line: the last step is done, not "current".
        const finished = phase === "closed" && last;
        const dot = finished ? "done" : state;
        return (
          <li key={st.label} aria-current={state === "current" || state === "fail" ? "step" : undefined} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <StepDot n={i + 1} state={dot} />
              {!last && <span className={cn("my-1 min-h-5 w-0.5 flex-1", i < pos ? "bg-ink" : "bg-line")} />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-[22px] pt-0.5">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5">
                <span
                  className={cn(
                    "text-sm",
                    state === "current" ? "font-semibold text-ink" : state === "fail" ? "font-semibold text-error-ink" : state === "done" ? "font-medium text-ink" : "font-medium text-ink-2",
                  )}
                >
                  {st.label}
                </span>
                {(dot === "done" || state === "current") && st.time && <span className="text-[11.5px] text-ink-2">{st.time}</span>}
              </div>
              <span className="text-[12.5px] text-ink-2">{st.sub}</span>
              {(state === "current" || state === "fail") && !finished && st.expect && (
                <span
                  className={cn(
                    "mt-1.5 self-start rounded-full px-2.5 py-[3px] text-xs font-medium",
                    state === "fail" ? "bg-error-bg text-error-ink" : "bg-warn-bg text-warn-ink",
                  )}
                >
                  {st.expect}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** What has happened, newest last, from the times the API gives. */
function activityOf(request: LawyerRequest): { at: string; text: string }[] {
  const lawyer = request.lawyer?.name ?? "A lawyer";
  const events: { at: string; text: string }[] = [{ at: request.createdAt, text: "You sent your request" }];
  if (request.quote) events.push({ at: request.quote.sentAt, text: `${lawyer} sent a ${money(request.quote.amount)} quote` });
  if (request.engagedAt) events.push({ at: request.engagedAt, text: `You confirmed ${lawyer}, who can now see your case` });
  if (request.closedAt) events.push({ at: request.closedAt, text: request.closedBy === "LAWYER" ? "Your lawyer ended the engagement" : "You ended the engagement" });
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

const CARD = "flex flex-col gap-4 rounded-modal border border-line bg-white p-6";
const HEADING = "font-display text-2xl font-normal tracking-[-0.02em]";

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-0.5 rounded-input border border-line bg-subtle px-4 py-3.5">
      <span className="text-[11.5px] text-ink-2">{label}</span>
      <span className="font-display text-xl">{children}</span>
    </div>
  );
}

function WithdrawControl({ request, caseId }: { request: LawyerRequest; caseId: string }) {
  const withdraw = useWithdrawLawyerRequestMutation(caseId);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
      {error && <ErrorBox message={error} />}
      {asking ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-error-line bg-error-bg px-3.5 py-3">
          <span className="text-[13px] text-error-ink">Withdraw this request? Lawyers who have it lose access to your summary. You can ask again later.</span>
          <div className="flex gap-2">
            <Button variant="soft" size="sm" onClick={() => setAsking(false)} disabled={withdraw.isPending} autoFocus>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="!normal-case !text-[13px] !font-semibold tracking-normal"
              disabled={withdraw.isPending}
              onClick={() => {
                setError("");
                withdraw.mutate(request.id, {
                  onError: (err) => {
                    setAsking(false);
                    setError(err instanceof Error ? err.message : "Couldn't withdraw. Try again.");
                  },
                });
              }}
            >
              {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="soft" size="sm" className="self-start" onClick={() => setAsking(true)}>
          Withdraw request
        </Button>
      )}
    </div>
  );
}

function LawyerHeader({ lawyer, tone = "plain", children }: { lawyer: NonNullable<LawyerRequest["lawyer"]>; tone?: "plain" | "success"; children?: ReactNode }) {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-3.5 rounded-modal border px-5 py-[18px]",
        tone === "success" ? "border-success-line bg-success-bg" : "border-line bg-white",
      )}
    >
      <Avatar initials={initialsOf(lawyer.name)} size={52} className="!border-0 !bg-ink !text-base !text-white" />
      <div className="flex min-w-[220px] flex-1 flex-col">
        <span className="text-base font-semibold">{children ?? lawyer.name}</span>
        <span className={cn("text-[12.5px]", tone === "success" ? "text-success-ink" : "text-ink-2")}>
          {lawyer.firmName ?? "Solo practitioner"} · {lawyer.regulator} {lawyer.registrationNumber} · verified
        </span>
      </div>
    </section>
  );
}

function QuoteStage({ c, request, finalising }: { c: Case; request: LawyerRequest; finalising: boolean }) {
  const confirm = useConfirmLawyerRequestMutation(c.id);
  const decline = useDeclineLawyerRequestMutation(c.id);
  const [error, setError] = useState("");
  const lawyer = request.lawyer;
  const first = lawyer?.name.split(" ")[0] ?? "your lawyer";
  const busy = confirm.isPending || decline.isPending;

  return (
    <div className="flex flex-col gap-4">
      {lawyer && <LawyerHeader lawyer={lawyer} />}
      {lawyer?.bio && <p className="px-1 text-[13px] leading-[1.6] text-ink-2">{lawyer.bio}</p>}

      {request.quote && (
        <section className={CARD}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow muted>{request.quote.type === "FIXED_FEE" ? "Fixed fee quote" : "First consultation"}</Eyebrow>
          </div>
          <span className="font-display text-[34px] tracking-[-0.02em]">{money(request.quote.amount)}</span>
          {request.quote.message && <p className="text-[#4a4a4a]">{request.quote.message}</p>}
          <div className="flex flex-col gap-1.5 rounded-input border border-line bg-subtle px-4 py-3.5 text-[13px]">
            <div className="flex justify-between gap-2">
              <span>{first}&apos;s fee, paid to them</span>
              <span className="font-semibold">{money(request.quote.amount)}</span>
            </div>
            <div className="flex justify-between gap-2 text-ink-2">
              <span>Paid to {first} directly, on the terms you agree</span>
              <span className="shrink-0">Nothing to pay now</span>
            </div>
          </div>
          {request.referralDisclosure && <span className="text-xs text-ink-2">{request.referralDisclosure}</span>}

          {error && <ErrorBox message={error} />}

          {finalising ? (
            <div className="flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-3 text-[13px] text-warn-ink">
              You confirmed {first}. They&apos;re finishing setup on their side — you&apos;ll be able to message them here in a few minutes. Nothing else for you to do.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="dark"
                className="!h-[46px] min-w-[200px] flex-1 !text-sm !font-semibold"
                disabled={busy}
                onClick={() => {
                  setError("");
                  confirm.mutate(request.id, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't confirm. Try again.") });
                }}
              >
                {confirm.isPending ? "Confirming…" : "Confirm this lawyer"}
              </Button>
              <Button
                variant="soft"
                className="!h-[46px] min-w-[200px] flex-1 !text-sm"
                disabled={busy}
                onClick={() => {
                  setError("");
                  decline.mutate({ id: request.id }, { onError: (err) => setError(err instanceof Error ? err.message : "Couldn't decline. Try again.") });
                }}
              >
                {decline.isPending ? "Declining…" : "Decline and keep looking"}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EngagedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const end = useEndLawyerRequestMutation(c.id);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const lawyer = request.lawyer;
  const first = lawyer?.name.split(" ")[0] ?? "your lawyer";
  return (
    <div className="flex flex-col gap-4">
      {lawyer && (
        <LawyerHeader lawyer={lawyer} tone="success">
          You&apos;re working with {lawyer.name}
        </LawyerHeader>
      )}
      <LawyerMessages c={c} requestId={request.id} lawyerName={lawyer?.name ?? "your lawyer"} closed={false} />
      {error && <ErrorBox message={error} />}
      {asking ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-error-line bg-error-bg px-3.5 py-3">
          <span className="min-w-[240px] flex-1 text-[13px] text-error-ink">End this engagement? {first} loses access to your case. Your messages stay readable.</span>
          <Button variant="soft" size="sm" onClick={() => setAsking(false)} disabled={end.isPending} autoFocus>
            Keep working
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="!normal-case !text-[13px] !font-semibold tracking-normal"
            disabled={end.isPending}
            onClick={() => {
              setError("");
              end.mutate(
                { id: request.id },
                {
                  onError: (err) => {
                    setAsking(false);
                    setError(err instanceof Error ? err.message : "Couldn't end the engagement. Try again.");
                  },
                },
              );
            }}
          >
            {end.isPending ? "Ending…" : "End engagement"}
          </Button>
        </div>
      ) : (
        <Button variant="quiet" size="sm" className="self-start !text-error hover:!text-error-ink" onClick={() => setAsking(true)}>
          End engagement
        </Button>
      )}
    </div>
  );
}

function ClosedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const { data: eligibility } = useEligibilityQuery(c.id);
  const name = request.lawyer?.name;
  return (
    <div className="flex flex-col gap-4">
      <section className={CARD}>
        <h2 className={HEADING}>Engagement ended</h2>
        <p className="text-[#4a4a4a]">
          {request.closedBy === "LAWYER" ? "Your lawyer closed this engagement." : "You ended this engagement."}
          {name && request.engagedAt && request.closedAt && ` You worked with ${name} from ${day(request.engagedAt)} to ${day(request.closedAt)}.`} They no longer have access to your case; your messages stay below.
        </p>
        {eligibility?.eligible && (
          <Button variant="dark" size="md" className="self-start" onClick={() => useLawyerRequestForm.getState().openFor(c.id)}>
            Get another lawyer
          </Button>
        )}
      </section>
      {/* The thread stays readable after the engagement ends (ilovelawyer-api#517). */}
      {request.lawyer && <LawyerMessages c={c} requestId={request.id} lawyerName={request.lawyer.name} closed />}
    </div>
  );
}

function ExpiredStage({ caseId }: { caseId: string }) {
  const { data: eligibility } = useEligibilityQuery(caseId);
  return (
    <section className={cn(CARD, "border-error-line")}>
      <h2 className={HEADING}>No lawyer picked up your request</h2>
      <p className="text-[#4a4a4a]">
        None of the matching lawyers picked up your request within 48 hours. You haven&apos;t been charged anything, and any case fee credit stays on your account.
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-[18px] text-[13px] text-[#4a4a4a]">
        <li>Answering the questions still open in your interview helps lawyers see what you need.</li>
        <li>You can send it again any time.</li>
      </ul>
      {eligibility?.eligible && (
        <Button variant="dark" size="md" className="self-start" onClick={() => useLawyerRequestForm.getState().openFor(caseId)}>
          Send it again
        </Button>
      )}
    </section>
  );
}

function StageCard({ request, phase }: { request: LawyerRequest; phase: Phase }) {
  if (phase === "sent") {
    return (
      <section className={CARD}>
        <h2 className={HEADING}>Preparing your request</h2>
        <p className="text-[#4a4a4a]">We&apos;re turning your overview into an anonymised summary — no names except for the conflict check. This takes about a minute; you can leave this page.</p>
        <div className="flex flex-col gap-2" aria-hidden>
          <span className="h-2.5 w-[90%] animate-pulse rounded-md bg-chip" />
          <span className="h-2.5 w-3/4 animate-pulse rounded-md bg-chip" />
          <span className="h-2.5 w-3/5 animate-pulse rounded-md bg-chip" />
        </div>
      </section>
    );
  }
  if (phase === "finding") {
    return (
      <section className={CARD}>
        <h2 className={HEADING}>Finding the right lawyer</h2>
        <p className="text-[#4a4a4a]">
          Verified lawyers who handle cases like yours have an anonymised summary of your case. The first to pick it up checks for conflicts and sends you a quote.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Tile label="Sent">{when(request.createdAt)}</Tile>
          <Tile label="Usually picked up within">a day</Tile>
        </div>
        <span className="text-[12.5px] text-ink-2">We&apos;ll email you the moment a lawyer picks it up.</span>
      </section>
    );
  }
  if (phase === "reviewing") {
    return (
      <section className={CARD}>
        <h2 className={HEADING}>A lawyer is reviewing your case</h2>
        <p className="text-[#4a4a4a]">They&apos;re checking they don&apos;t already act for the other side, then they&apos;ll send you a quote. You don&apos;t need to do anything yet.</p>
        <div className="flex flex-wrap gap-2.5">
          <Tile label="If they can't take it">
            <span className="font-sans text-sm">It goes back to other lawyers automatically</span>
          </Tile>
        </div>
      </section>
    );
  }
  return null;
}

const VISIBILITY = (engaged: boolean, since?: string | null) => [
  { text: "Anonymised summary of your overview", when: "From the start", yes: true },
  { text: "Names, only for a conflict check", when: "From the start", yes: true },
  { text: "Your case, documents and interview (read-only)", when: engaged ? (since ? `Since ${day(since)}` : "Now") : "Once you confirm", yes: engaged },
];

export function LawyerTab({ c, request }: { c: Case; request: LawyerRequest }) {
  // [id]/page.tsx filters "withdrawn" out before mounting this tab at all — this is just so the
  // rest of the function can treat the request as one that is still on screen.
  if (clientRequestStage(request.status) === "withdrawn") return null;

  const phase = phaseOf(request);
  const canWithdraw = ["sent", "finding", "reviewing", "quote"].includes(phase);
  const showVisibility = !["closed", "expired"].includes(phase);
  const engaged = phase === "engaged";
  const activity = activityOf(request);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-start gap-6 px-4 pb-14 pt-7 md:px-10">
        <aside aria-label="Request progress" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-card border border-line bg-white p-5">
            <div className="flex flex-col gap-0.5">
              <Eyebrow muted>Matched for you</Eyebrow>
              <h2 className="text-base font-semibold">Your lawyer request</h2>
            </div>
            <RequestSteps request={request} phase={phase} />
            {canWithdraw && <WithdrawControl request={request} caseId={c.id} />}
          </section>

          <section className="flex flex-col gap-2.5 rounded-card border border-line bg-white px-5 py-[18px]">
            <h3>
              <Eyebrow muted>Activity</Eyebrow>
            </h3>
            <ul className="flex flex-col gap-2.5">
              {activity.map((ev) => (
                <li key={`${ev.at}-${ev.text}`} className="grid grid-cols-[92px_minmax(0,1fr)] gap-2.5 text-[12.5px]">
                  <span className="text-ink-2">{when(ev.at).replace(",", "")}</span>
                  <span>{ev.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          {(phase === "sent" || phase === "finding" || phase === "reviewing") && <StageCard request={request} phase={phase} />}
          {(phase === "quote" || phase === "finalising") && <QuoteStage c={c} request={request} finalising={phase === "finalising"} />}
          {phase === "engaged" && <EngagedStage c={c} request={request} />}
          {phase === "closed" && <ClosedStage c={c} request={request} />}
          {phase === "expired" && <ExpiredStage caseId={c.id} />}

          {showVisibility && (
            <section className="flex flex-col gap-2.5 rounded-card border border-line bg-white px-5 py-[18px]">
              <h3 className="text-[13.5px] font-semibold">What the lawyer can see</h3>
              <ul className="flex flex-col gap-2">
                {VISIBILITY(engaged, request.engagedAt).map((v) => (
                  <li key={v.text} className="flex items-center gap-2.5 text-[13px]">
                    <span
                      aria-hidden
                      className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", v.yes ? "bg-success-bg text-success-ink" : "bg-chip text-ink-2")}
                    >
                      {v.yes ? "✓" : "–"}
                    </span>
                    <span className="flex-1">{v.text}</span>
                    <span className="text-xs text-ink-2">{v.when}</span>
                    <span className="sr-only">{v.yes ? "(visible)" : "(not visible yet)"}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
