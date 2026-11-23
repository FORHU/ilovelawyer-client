"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleCheck, MessageCircleMore, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Modal } from "@/components/ui/modal";
import { Avatar, Eyebrow, initialsOf } from "@/components/ui/misc";
import { useDevice } from "@/components/device/device-provider";
import { cn } from "@/lib/cn";
import { LawyerMessages } from "@/components/case/lawyer-messages";
import { StripePaymentElement } from "@/components/payment/stripe-payment-element";
import {
  getQuotationPayment,
  usePayQuotationMutation,
  useRefreshLawyerRequests,
  useConfirmLawyerRequestMutation,
  useDeclineLawyerRequestMutation,
  useEligibilityQuery,
  useEndLawyerRequestMutation,
  useConfirmCompletionMutation,
  useDeclineCompletionMutation,
  useLawyerRequestForm,
  COMPLETION_REASON_MAX_LENGTH,
  useWithdrawLawyerRequestMutation,
  type ClientRefundSummary,
  type LawyerOffer,
  type LawyerRequest,
  type PaymentStart,
  type Quotation,
} from "@/lib/lawyer-requests/api";
import { useEngagementMessagesQuery } from "@/lib/lawyer-requests/messages";
import { amountDue, day, paidThroughUs, pickByDay, pickByTime, POSITION, quoteExpired, stepsFor, VISIBILITY, type Phase } from "@/lib/lawyer-requests/phase";
import { quoteAgainstBudget, type ClientBudget } from "@/lib/cases/budget";
import { ApiError } from "@/lib/api/fetch";
import { CLIENT_HANDOFF_ERROR_CODES } from "@/lib/client-handoff";
import { firstName, formatDateTime } from "@/lib/format";
import { money } from "@/lib/pricing";
import type { Case } from "@/lib/types";

import { useT } from "@/components/site/language-provider";
import { msg } from "@/lib/i18n/msg";
// The pieces of the Lawyer tab that both its views use: the progress line, the stage cards for each
// phase, and the controls inside them. The desktop and mobile views (lawyer-tab.desktop.tsx and
// lawyer-tab.mobile.tsx) decide how they are arranged; classes marked `max-md:` are the phone's
// sizes for the same pieces (the same 768px line as <Responsive>).

/** Up to 3 lawyers can take up a request and quote (ilovelawyer-api, several lawyers). */
const MAX_LAWYERS = 3;

const CARD = "flex flex-col gap-4 rounded-modal border border-line bg-surface p-6 max-md:p-5";
const HEADING = "font-display text-2xl font-normal tracking-[-0.02em] max-md:text-[22px]";

function StepDot({ n, state }: { n: number; state: "done" | "current" | "fail" | "upcoming" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "box-border flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
        state === "done" && "bg-ink text-white",
        state === "current" && "border-2 border-gold bg-warn-bg text-gold shadow-[0_0_0_4px_rgb(138_98_0/0.12)]",
        state === "fail" && "border-2 border-error bg-error-bg text-error",
        state === "upcoming" && "border-[1.5px] border-line-input bg-surface text-ink-2",
      )}
    >
      {state === "done" ? <Check size={13} strokeWidth={3} /> : state === "fail" ? "!" : n}
    </span>
  );
}

/** The five-step line (#19): done steps check off, the current one is ringed and says what to
 * expect, later ones are dimmed. A request nobody picked up fails on step two. */
export function RequestSteps({ request, phase }: { request: LawyerRequest; phase: Phase }) {
  const t = useT();
  const steps = stepsFor(request, phase);
  const pos = POSITION[phase];
  const failed = phase === "expired";
  return (
    <ol className="flex flex-col" aria-label={t("Request progress")}>
      {steps.map((st, i) => {
        const state = i < pos ? "done" : i === pos ? (failed ? "fail" : "current") : "upcoming";
        const last = i === steps.length - 1;
        // Closed is the end of the line: the last step is done, not "current".
        const finished = phase === "closed" && last;
        const dot = finished ? "done" : state;
        return (
          <li key={i} aria-current={state === "current" || state === "fail" ? "step" : undefined} className="flex gap-3.5">
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

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-0.5 rounded-input border border-line bg-subtle px-4 py-3.5 max-md:min-w-0 max-md:basis-full">
      <span className="text-[11.5px] text-ink-2">{label}</span>
      <span className="font-display text-xl">{children}</span>
    </div>
  );
}

/** What the client pays for a quotation: the lawyer's quote, nothing added. ilovelawyer's platform
 * fee is deducted from what the lawyer receives, so it isn't the client's to pay. */
function QuoteBreakdown({ quotation, lawyerFirst }: { quotation: Quotation; lawyerFirst: string }) {
  const t = useT();
  // The quote is fixed when it's sent and copied when it's accepted, so this is what's charged.
  const total = amountDue(quotation);
  return (
    <div className="flex flex-col gap-1.5 rounded-input border border-line bg-subtle px-4 py-3.5 text-[13px]">
      <div className="flex justify-between gap-2">
        <span>{t("{name}'s quote", { name: lawyerFirst })}</span>
        <span>{money(total)}</span>
      </div>
      <div className="flex justify-between gap-2 text-ink-2">
        <span>{t("Added by ilovelawyer")}</span>
        <span>{t("Nothing")}</span>
      </div>
      <div className="flex justify-between gap-2 border-t border-line pt-2 text-[15px] font-semibold">
        <span>{t("You pay")}</span>
        <span>{money(total)}</span>
      </div>
    </div>
  );
}

/** A short notice in a grey box: how ilovelawyer is paid, and what hiring a lawyer hands over. Both
 * are shown before any Accept button, since accepting a quote acknowledges them. */
function DisclosureNote({ text }: { text: string }) {
  return <div className="rounded-input border border-line bg-subtle px-4 py-3 text-xs leading-[1.6] text-ink-2">{text}</div>;
}

/** The fee note, then what hiring hands over: the two things read before any Accept. */
function Disclosures({ request }: { request: LawyerRequest }) {
  return (
    <>
      {request.referralDisclosure && <DisclosureNote text={request.referralDisclosure} />}
      {request.sharingNotice && <DisclosureNote text={request.sharingNotice} />}
    </>
  );
}

export function WithdrawControl({ request, withdraw, disabled }: { request: LawyerRequest; withdraw: ReturnType<typeof useWithdrawLawyerRequestMutation>; disabled?: boolean }) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
      {error && <ErrorBox message={error} />}
      {asking ? (
        <div className="flex flex-col gap-2.5 rounded-xl border border-error-line bg-error-bg px-3.5 py-3">
          <span className="text-[13px] text-error-ink">{t("Withdraw this request? Lawyers who have it lose access to your summary. You can ask again later.")}</span>
          <div className="flex gap-2">
            <Button variant="soft" size="sm" className="max-md:!h-11 max-md:flex-1" onClick={() => setAsking(false)} disabled={withdraw.isPending} autoFocus>
              {t("Keep it")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="!normal-case !text-[13px] !font-semibold tracking-normal max-md:!h-11 max-md:flex-1"
              disabled={withdraw.isPending || disabled}
              onClick={() => {
                setError("");
                withdraw.mutate(request.id, {
                  onError: (err) => {
                    setAsking(false);
                    setError(err instanceof Error ? err.message : t("Couldn't withdraw. Try again."));
                  },
                });
              }}
            >
              {withdraw.isPending ? t("Withdrawing…") : t("Withdraw")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="soft" size="sm" className="self-start max-md:!h-11 max-md:w-full" onClick={() => setAsking(true)} disabled={disabled}>
          {t("Withdraw request")}
        </Button>
      )}
    </div>
  );
}

function LawyerHeader({ lawyer, tone = "plain", children }: { lawyer: NonNullable<LawyerRequest["lawyer"]>; tone?: "plain" | "success"; children?: ReactNode }) {
  const t = useT();
  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-3.5 rounded-modal border px-5 py-[18px] max-md:px-4",
        tone === "success" ? "border-success-line bg-success-bg" : "border-line bg-surface",
      )}
    >
      <Avatar initials={initialsOf(lawyer.name)} size={52} className="!border-0 !bg-ink !text-base !text-white" />
      <div className="flex min-w-[220px] flex-1 flex-col max-md:min-w-[160px]">
        <span className="text-base font-semibold">{children ?? lawyer.name}</span>
        <span className={cn("text-[12.5px]", tone === "success" ? "text-success-ink" : "text-ink-2")}>
          {lawyer.firmName ?? t("Solo practitioner")} · {t(lawyer.regulator ?? "")} {lawyer.registrationNumber} · {t("verified")}
        </span>
      </div>
    </section>
  );
}

/** The quote against what the client said they can spend (phase 5c): within or above it, and a note
 * when it isn't the kind of fee they preferred. Nothing for "Not sure". Measured by what the client
 * pays (the lawyer's quote), the same amount the card shows. */
function BudgetFit({ budget, quote, payMinor }: { budget: ClientBudget | null; quote: NonNullable<LawyerOffer["quote"]>; payMinor: number }) {
  const t = useT();
  const against = quoteAgainstBudget(budget, { type: quote.type, amountMinor: payMinor });
  if (!against || (!against.fit && !against.otherFeeType)) return null;
  return (
    <div className="flex flex-wrap gap-1.5 text-[11.5px] font-medium">
      {against.fit === "WITHIN" && (
        <span className="rounded-full border border-success-line bg-success-bg px-2.5 py-0.5 text-success-ink">{t("Within your budget")}</span>
      )}
      {against.fit === "ABOVE" && <span className="rounded-full border border-warn-line bg-warn-bg px-2.5 py-0.5 text-warn-ink">{t("Above your budget")}</span>}
      {against.otherFeeType && (
        <span className="rounded-full border border-line px-2.5 py-0.5 text-ink-2">{t("Not the kind of fee you preferred")}</span>
      )}
    </div>
  );
}

/** One lawyer's thread before hire (phase 5b): a button with their unread count, opening the
 * thread. Kept closed until asked for, so opening the tab doesn't mark every lawyer's messages read.
 * On a phone the thread is the messages card, which opens a full screen of its own. */
function OfferMessages({ c, request, offer }: { c: Case; request: LawyerRequest; offer: LawyerOffer }) {
  const t = useT();
  const device = useDevice();
  const [open, setOpen] = useState(false);
  const thread = useEngagementMessagesQuery(request.id, offer.claimId);
  const unread = thread.data?.unread ?? 0;

  if (device === "mobile") {
    return <LawyerMessages c={c} requestId={request.id} claimId={offer.claimId} lawyerName={offer.lawyer.name} closed={false} beforeHire />;
  }
  if (open) {
    return (
      <div className="flex flex-col gap-2">
        <LawyerMessages c={c} requestId={request.id} claimId={offer.claimId} lawyerName={offer.lawyer.name} closed={false} beforeHire />
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
          {t("Hide messages")}
        </Button>
      </div>
    );
  }
  return (
    <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
      <MessageCircleMore size={14} aria-hidden="true" />
      {t("Message {name}", { name: offer.lawyer.name })}
      {unread > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] text-white" aria-label={t("{n} unread", { n: unread })}>
          {unread}
        </span>
      )}
    </Button>
  );
}

/** One lawyer on the request (several lawyers): their quote, with Accept and Decline, or that they're
 * still reviewing. `busy` holds every lawyer's buttons while any confirm, decline or withdraw runs.
 * With up to three quotes each card keeps its own Accept and Decline, so it is always clear which
 * lawyer a button is for. */
function OfferCard({
  c,
  request,
  offer,
  confirm,
  decline,
  busy,
  onError,
}: {
  c: Case;
  request: LawyerRequest;
  offer: LawyerOffer;
  confirm: ReturnType<typeof useConfirmLawyerRequestMutation>;
  decline: ReturnType<typeof useDeclineLawyerRequestMutation>;
  busy: boolean;
  onError: (message: string) => void;
}) {
  const t = useT();
  const first = firstName(offer.lawyer.name) ?? t("the lawyer");
  const pay = offer.quotation ? amountDue(offer.quotation) : null;
  const expired = !!offer.quotation && quoteExpired(offer.quotation);
  return (
    <div className="flex flex-col gap-3">
      <LawyerHeader lawyer={offer.lawyer} />
      {offer.lawyer.bio && <p className="px-1 text-[13px] leading-[1.6] text-ink-2">{offer.lawyer.bio}</p>}
      {offer.quote ? (
        <section className={CARD}>
          <Eyebrow muted>{offer.quote.type === "FIXED_FEE" ? t("Fixed fee quote") : t("First consultation")}</Eyebrow>
          <span className="font-display text-[34px] tracking-[-0.02em] max-md:text-[30px]">{money(pay ?? offer.quote.amount)}</span>
          <BudgetFit budget={c.budget} quote={offer.quote} payMinor={(pay ?? offer.quote.amount).amountMinor} />
          {offer.quote.message && <p className="text-ink-soft">{offer.quote.message}</p>}
          {offer.quotation && <QuoteBreakdown quotation={offer.quotation} lawyerFirst={first} />}
          {offer.quotation &&
            (expired ? (
              <p className="text-[12.5px] text-error-ink">{t("This quote expired on {date}, so it can't be accepted any more.", { date: pickByDay(offer.quotation.expiresAt) })}</p>
            ) : (
              <p className="text-[12.5px] text-ink-2">{t("This quote is valid until {date}. Accept and pay before then.", { date: pickByDay(offer.quotation.expiresAt) })}</p>
            ))}
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="dark"
              className="!h-[46px] min-w-[200px] flex-1 !text-sm !font-semibold max-md:!h-12 max-md:min-w-full"
              disabled={busy || expired}
              onClick={() =>
                confirm.mutate({ id: request.id, claimId: offer.claimId }, { onError: (err) => onError(err instanceof Error ? err.message : t("Couldn't confirm. Try again.")) })
              }
            >
              {confirm.isPending && confirm.variables?.claimId === offer.claimId
                ? t("Accepting…")
                : pay && pay.amountMinor > 0
                  ? t("Accept and pay {amount}", { amount: money(pay) })
                  : t("Hire {name}", { name: offer.lawyer.name })}
            </Button>
            <Button
              variant="soft"
              className="!h-[46px] min-w-[200px] flex-1 !text-sm max-md:!h-12 max-md:min-w-full"
              disabled={busy}
              onClick={() =>
                decline.mutate({ id: request.id, claimId: offer.claimId }, { onError: (err) => onError(err instanceof Error ? err.message : t("Couldn't decline. Try again.")) })
              }
            >
              {decline.isPending && decline.variables?.claimId === offer.claimId ? t("Declining…") : t("Decline this quote")}
            </Button>
          </div>
        </section>
      ) : (
        <div className="rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">{t("Reviewing your case. They'll send a quote within 24 hours.")}</div>
      )}
      <OfferMessages c={c} request={request} offer={offer} />
    </div>
  );
}

/** The quotes (several lawyers, ilovelawyer-api phase 5): every lawyer on the request, the date to
 * choose by, and the referral disclosure above any Hire. `confirm` and `decline` belong to
 * the tab, which also disables Withdraw while either is running. */
export function QuoteStage({
  c,
  request,
  finalising,
  confirm,
  decline,
  locked,
}: {
  c: Case;
  locked: boolean;
  request: LawyerRequest;
  finalising: boolean;
  confirm: ReturnType<typeof useConfirmLawyerRequestMutation>;
  decline: ReturnType<typeof useDeclineLawyerRequestMutation>;
}) {
  const t = useT();
  const [error, setError] = useState("");
  const busy = confirm.isPending || decline.isPending || locked;

  if (finalising) {
    if (request.awaitingPayment && request.quotation) return <PayStage c={c} request={request} quotation={request.quotation} />;
    const first = firstName(request.lawyer?.name) ?? t("your lawyer");
    return (
      <div className="flex flex-col gap-4">
        {request.lawyer && <LawyerHeader lawyer={request.lawyer} />}
        <div className="flex items-center gap-2 rounded-xl border border-warn-line bg-warn-bg px-3.5 py-3 text-[13px] text-warn-ink">
          {t("You confirmed {name}. They're finishing setup on their side — you'll be able to message them here in a few minutes. Nothing else for you to do.", { name: first })}
        </div>
        <Disclosures request={request} />
      </div>
    );
  }

  const quoted = request.lawyers.filter((l) => l.quote).length;
  return (
    <div className="flex flex-col gap-4">
      <h2 className={HEADING}>{quoted > 1 ? t("{n} quotes received", { n: quoted }) : t("Quote received")}</h2>
      {request.pickByAt && (
        <p className="text-[13px] text-ink-2">{t("Choose a lawyer by {time}. If you don't, this request closes and you can ask again.", { time: pickByTime(request.pickByAt) })}</p>
      )}

      {/* Above the offers, so it's read before any Accept, which acknowledges it. The sharing
          notice comes from the API, in the words the client agreed to when asking (#922). */}
      <Disclosures request={request} />

      {request.lawyers.map((offer) => (
        <OfferCard
          key={offer.claimId || offer.lawyer.id}
          c={c}
          request={request}
          offer={offer}
          confirm={confirm}
          decline={decline}
          busy={busy}
          onError={(message) => setError(message)}
        />
      ))}

      {(request.openToLawyers ?? request.lawyers.length < MAX_LAWYERS) && (
        <div className="text-xs text-ink-2">{t("Up to {n} lawyers can send you a quote. Others may still take up your request.", { n: MAX_LAWYERS })}</div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}

const isDev = process.env.NODE_ENV !== "production";
const PAYMENT_CHECKS = 10;
const PAYMENT_CHECK_MS = 1500;

/** The client accepted a quote: they pay it here, through ilovelawyer. With Stripe, its Payment
 * Element takes the card; with the dummy provider, the payment settles at once. Once paid, the API
 * engages the request and this tab moves on. */
function PayStage({ c, request, quotation }: { c: Case; request: LawyerRequest; quotation: Quotation }) {
  const t = useT();
  const pay = usePayQuotationMutation(c.id);
  const refresh = useRefreshLawyerRequests(c.id);
  const [intent, setIntent] = useState<PaymentStart["intent"]>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  // The API says it's paid: only the stage changing is left, so nothing to pay again.
  const [paid, setPaid] = useState(false);
  const [simulateDecline, setSimulateDecline] = useState(false);
  const first = firstName(request.lawyer?.name) ?? t("your lawyer");
  const total = amountDue(quotation);
  const expired = quoteExpired(quotation);
  const expiredMessage = t("This quote expired on {date}, so it can't be paid any more. You can ask for a lawyer again.", { date: pickByDay(quotation.expiresAt) });

  function start() {
    setError("");
    pay.mutate(
      { id: request.id, quotationId: quotation.id, testOutcome: isDev && simulateDecline ? "decline" : undefined },
      {
        onSuccess: (started) => {
          if (started.intent) setIntent(started.intent);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === CLIENT_HANDOFF_ERROR_CODES.QUOTATION_EXPIRED) return setError(expiredMessage);
          setError(err instanceof Error ? err.message : t("Your payment didn't go through. Try again."));
        },
      },
    );
  }

  // Stripe has the payment: ask the API, which settles it, until it says how it ended. Only a
  // success leaves the Pay button away; any other ending brings it back with what happened, and a
  // payment that settles later still moves this tab on (the refresh and the socket).
  async function afterStripe() {
    setIntent(null);
    setChecking(true);
    try {
      for (let i = 0; i < PAYMENT_CHECKS; i++) {
        const { payment } = await getQuotationPayment(request.id);
        if (payment?.status === "SUCCEEDED") {
          setPaid(true);
          return;
        }
        if (payment?.status === "FAILED" || payment?.status === "CANCELED") {
          setError(payment.failureReason ?? t("Your payment didn't go through. Try again."));
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, PAYMENT_CHECK_MS));
      }
      setError(t("Your payment is still being processed. This page moves on by itself once it's confirmed, so there's no need to pay again."));
    } catch {
      setError(t("We couldn't check your payment. Refresh the page to see whether it went through before paying again."));
    } finally {
      setChecking(false);
      refresh();
    }
  }

  // Back from a payment method that left the page (a bank redirect, some 3D Secure flows): Stripe
  // returns here with the intent in the URL. Check it the same way, then take the params off.
  const returnChecked = useRef(false);
  const afterStripeRef = useRef(afterStripe);
  useEffect(() => {
    afterStripeRef.current = afterStripe;
  });
  useEffect(() => {
    if (returnChecked.current) return;
    returnChecked.current = true;
    const params = new URLSearchParams(window.location.search);
    if (!params.get("payment_intent") || !params.get("redirect_status")) return;
    ["payment_intent", "payment_intent_client_secret", "redirect_status"].forEach((name) => params.delete(name));
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    void afterStripeRef.current();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {request.lawyer && <LawyerHeader lawyer={request.lawyer} />}
      <section className={CARD}>
        <h2 className={HEADING}>{t("Pay {name}'s quote", { name: first })}</h2>
        <p className="text-ink-soft">
          {expired
            ? t("You accepted {name}'s quote, but it expired on {date} before it was paid.", { name: first, date: pickByDay(quotation.expiresAt) })
            : t("You accepted {name}'s quote. Pay it here to get started: {name} can see your case and message you once it's paid. Pay by {date}, or the quote expires.", {
                name: first,
                date: pickByDay(quotation.expiresAt),
              })}
        </p>
        <QuoteBreakdown quotation={quotation} lawyerFirst={first} />
        {/* Paying is what gives the lawyer the case, so the notice is here too, above the Pay button. */}
        {!expired && request.sharingNotice && <DisclosureNote text={request.sharingNotice} />}
        {error && <ErrorBox message={error} />}
        {checking ? (
          <div className="py-2 text-center text-[13px] text-ink-2">{t("Confirming your payment…")}</div>
        ) : paid ? (
          <div className="py-2 text-center text-[13px] text-ink-2">{t("Your payment went through. Setting up your engagement…")}</div>
        ) : expired ? (
          <ErrorBox message={expiredMessage} />
        ) : intent ? (
          <StripePaymentElement
            clientSecret={intent.clientSecret}
            publishableKey={intent.publishableKey}
            returnUrl={typeof window === "undefined" ? "" : window.location.href}
            payLabel={t("Pay {amount}", { amount: money(total) })}
            onPaid={() => void afterStripe()}
            onFailed={() => {
              // Back to the Pay button, which asks the API for the payment again.
              setIntent(null);
              setError(t("The payment form couldn't load. Try again."));
            }}
          />
        ) : (
          <>
            {isDev && (
              <label className="flex items-center gap-2 text-[12px] text-muted">
                <input type="checkbox" checked={simulateDecline} onChange={(e) => setSimulateDecline(e.target.checked)} />
                {t("Dev only: simulate a declined payment (dummy provider; with Stripe, use card 4000 0000 0000 0002)")}
              </label>
            )}
            <Button variant="dark" className="!h-[46px] !text-sm !font-semibold max-md:!h-12" disabled={pay.isPending} onClick={start}>
              {pay.isPending ? t("Starting payment…") : t("Pay {amount}", { amount: money(total) })}
            </Button>
          </>
        )}
        <span className="text-center text-xs text-muted">{t("Pay securely with Stripe. Your card details go to Stripe, never to ilovelawyer.")}</span>
      </section>
    </div>
  );
}

/** "Payment successful", at the top of the engaged stage, right after the client pays. */
export function PaymentSuccess({ request, onDismiss }: { request: LawyerRequest; onDismiss: () => void }) {
  const t = useT();
  // Only a real payment: a free first consultation engages with nothing paid.
  if (!paidThroughUs(request.quotation)) return null;
  const paid = amountDue(request.quotation);
  const paidAt = request.quotation?.paidAt ?? request.engagedAt;
  const lawyerName = request.lawyer?.name ?? t("your lawyer");
  const first = firstName(request.lawyer?.name) ?? t("your lawyer");
  return (
    <section role="status" className="flex items-start gap-3 rounded-card border border-success-line bg-success-bg px-5 py-4 text-success-ink">
      <CircleCheck size={22} className="mt-0.5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-[15px] font-semibold">{t("Payment successful")}</h2>
        <p className="text-[13px] leading-[1.5]">
          {t("You paid {amount} to {lawyer}. {name} can now see your case and message you here.", { amount: money(paid), lawyer: lawyerName, name: first })}
        </p>
        {paidAt && <p className="text-xs opacity-80">{t("Paid {date}", { date: formatDateTime(paidAt) })}</p>}
      </div>
      <button type="button" aria-label={t("Dismiss")} onClick={onDismiss} data-no-tap className="flex size-11 shrink-0 items-center justify-center text-success-ink md:size-auto">
        <X size={16} />
      </button>
    </section>
  );
}

/**
 * The lawyer says the work is finished: the client confirms it, which closes the engagement, or says
 * what's left, which goes to the lawyer and keeps it open. Unanswered, it closes by itself on
 * `autoClosesAt`. After a "not yet", a line says so until the lawyer asks again.
 */
/** "Confirm and close", said twice: what closing means for the client, before it happens. It can't
 * be undone: the lawyer loses access, and any payment goes to them after the usual hold. */
function ConfirmCompletionModal({ c, request, onClose }: { c: Case; request: LawyerRequest; onClose: () => void }) {
  const t = useT();
  const confirm = useConfirmCompletionMutation(c.id);
  const [error, setError] = useState("");
  const first = firstName(request.lawyer?.name) ?? t("Your lawyer");
  const paid = paidThroughUs(request.quotation);
  return (
    <Modal open onClose={onClose} locked={confirm.isPending} title={t("Is the work finished?")} subtitle={t("Confirm that {name} has finished the work on your case.", { name: first })}>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-[1.5] text-ink-2">
        <li>{t("The engagement closes, and {name} no longer has access to your case.", { name: first })}</li>
        {paid ? (
          <li>{t("Nothing is refunded: {name} is paid for the work after the usual holding period.", { name: first })}</li>
        ) : (
          <li>{t("Nothing was paid through ilovelawyer, so there's nothing to refund.")}</li>
        )}
        <li>{t("You can rate {name} once it's closed.", { name: first })}</li>
        <li>{t("You can't undo this. If something is still left to do, choose “It's not finished” instead.")}</li>
      </ul>
      {error && <ErrorBox message={error} />}
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={confirm.isPending}>
          {t("Not yet")}
        </Button>
        <Button
          variant="primary"
          disabled={confirm.isPending}
          onClick={() => {
            setError("");
            confirm.mutate(request.id, {
              onSuccess: onClose,
              onError: (err) => setError(err instanceof Error ? err.message : t("Couldn't confirm. Try again.")),
            });
          }}
        >
          {confirm.isPending ? t("Confirming…") : t("Yes, close the engagement")}
        </Button>
      </div>
    </Modal>
  );
}

export function CompletionCard({ c, request }: { c: Case; request: LawyerRequest }) {
  const t = useT();
  const decline = useDeclineCompletionMutation(c.id);
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const completion = request.completion;
  const first = firstName(request.lawyer?.name) ?? t("Your lawyer");
  if (!completion) return null;
  if (!completion.requestedAt) {
    if (!completion.declinedAt) return null;
    return (
      <p className="rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">
        {t("You told {name} the work isn't finished on {date}. They'll let you know when it is.", { name: first, date: day(completion.declinedAt) })}
      </p>
    );
  }
  const busy = decline.isPending;
  const fail = (err: unknown, fallback: string) => setError(err instanceof Error ? err.message : fallback);
  return (
    <section aria-labelledby="completion-heading" className="flex flex-col gap-3 rounded-input border border-gold/40 bg-warn-bg px-4 py-4">
      <h2 id="completion-heading" className="text-[15px] font-semibold">
        {t("{name} says the work is finished", { name: first })}
      </h2>
      {completion.note && <p className="whitespace-pre-wrap break-words text-[13.5px] leading-[1.5] text-ink">&ldquo;{completion.note}&rdquo;</p>}
      <p className="text-[13px] text-ink-2">
        {t("Confirm it to close the engagement, or tell {name} what's left.", { name: first })}
        {completion.autoClosesAt && ` ${t("If you don't answer by {date}, it closes by itself.", { date: day(completion.autoClosesAt) })}`}
      </p>
      {error && <ErrorBox message={error} />}
      {declining ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="completion-reason" className="text-[13px] font-semibold">
            {t("What's left to do?")}
          </label>
          <textarea
            id="completion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={COMPLETION_REASON_MAX_LENGTH}
            rows={3}
            disabled={busy}
            autoFocus
            className="w-full resize-none rounded-input border border-line-input bg-surface px-3.5 py-2.5 text-[14px] outline-none focus:border-ink disabled:opacity-60"
          />
          <div className="flex flex-wrap gap-2.5">
            <Button variant="soft" size="sm" className="max-md:!h-11 max-md:flex-1" disabled={busy} onClick={() => setDeclining(false)}>
              {t("Back")}
            </Button>
            <Button
              variant="dark"
              size="sm"
              className="max-md:!h-11 max-md:flex-1"
              disabled={busy || reason.trim() === ""}
              onClick={() => {
                setError("");
                decline.mutate(
                  { id: request.id, reason: reason.trim() },
                  { onSuccess: () => setDeclining(false), onError: (err) => fail(err, t("Couldn't send that. Try again.")) },
                );
              }}
            >
              {decline.isPending ? t("Sending…") : t("Send to {name}", { name: first })}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="dark"
            size="sm"
            className="max-md:!h-11 max-md:flex-1"
            disabled={busy}
            onClick={() => {
              setError("");
              setConfirming(true);
            }}
          >
            {t("Confirm and close")}
          </Button>
          <Button variant="soft" size="sm" className="max-md:!h-11 max-md:flex-1" disabled={busy} onClick={() => setDeclining(true)}>
            {t("It's not finished")}
          </Button>
        </div>
      )}
      {confirming && <ConfirmCompletionModal c={c} request={request} onClose={() => setConfirming(false)} />}
    </section>
  );
}

export function EngagedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const t = useT();
  const end = useEndLawyerRequestMutation(c.id);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const lawyer = request.lawyer;
  const first = firstName(lawyer?.name) ?? t("your lawyer");
  return (
    <div className="flex flex-col gap-4">
      {lawyer && (
        <LawyerHeader lawyer={lawyer} tone="success">
          {t("You're working with {name}", { name: lawyer.name })}
        </LawyerHeader>
      )}
      <CompletionCard c={c} request={request} />
      {request.refund && <RefundSummary refund={request.refund} />}
      <LawyerMessages c={c} requestId={request.id} lawyerName={lawyer?.name ?? t("your lawyer")} closed={false} />
      {error && <ErrorBox message={error} />}
      {asking ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-error-line bg-error-bg px-3.5 py-3">
          <span className="min-w-[240px] flex-1 text-[13px] text-error-ink max-md:min-w-full">{t("End this engagement? {name} loses access to your case. Your messages stay readable.", { name: first })}</span>
          <Button variant="soft" size="sm" className="max-md:!h-11 max-md:flex-1" onClick={() => setAsking(false)} disabled={end.isPending} autoFocus>
            {t("Keep working")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="!normal-case !text-[13px] !font-semibold tracking-normal max-md:!h-11 max-md:flex-1"
            disabled={end.isPending}
            onClick={() => {
              setError("");
              end.mutate(
                { id: request.id },
                {
                  onError: (err) => {
                    setAsking(false);
                    setError(err instanceof Error ? err.message : t("Couldn't end the engagement. Try again."));
                  },
                },
              );
            }}
          >
            {end.isPending ? t("Ending…") : t("End engagement")}
          </Button>
        </div>
      ) : (
        <Button variant="quiet" size="sm" className="self-start !text-error hover:!text-error-ink max-md:!h-11" onClick={() => setAsking(true)}>
          {t("End engagement")}
        </Button>
      )}
    </div>
  );
}

/** Where a refund stands, as the client reads it: what the Lawyer Exit's status means for their money. */
const EXIT_REFUND_STATUS: Record<NonNullable<ClientRefundSummary["lawyerExit"]>["status"], string> = {
  REFUNDING: msg("Your refund is on its way."),
  AWAITING_REVIEW: msg("We're reviewing your refund, to decide how much of your payment comes back to you. We'll let you know."),
  WAITING_ON_DISPUTE: msg("Your bank is looking at a dispute on this payment, so it decides what you get back."),
  NEEDS_ATTENTION: msg("We're sorting out your refund. You don't need to do anything."),
  SETTLED: msg("Your refund is settled."),
};

/** The client's payment for the lawyer they hired and what's come back of it: shown once anything has
 * been, or is being, refunded, and always after a lawyer stopped acting. */
export function RefundSummary({ refund }: { refund: ClientRefundSummary }) {
  const t = useT();
  const exit = refund.lawyerExit;
  const done = refund.refunds.filter((r) => r.status === "SUCCEEDED");
  if (!exit && done.length === 0 && refund.pending.amountMinor === 0) return null;
  return (
    <div className="flex flex-col gap-3 rounded-input border border-line bg-subtle px-4 py-3.5">
      <div className="flex flex-wrap gap-2.5">
        <Tile label={t("You paid")}>{money(refund.paid)}</Tile>
        <Tile label={t("Refunded to your card")}>{money(refund.refunded)}</Tile>
        {refund.pending.amountMinor > 0 && <Tile label={t("On its way")}>{money(refund.pending)}</Tile>}
      </div>
      {exit && <p className="text-[13px] text-ink-2">{exit.status === "SETTLED" && refund.refunded.amountMinor === 0 ? t("No refund is due.") : t(EXIT_REFUND_STATUS[exit.status])}</p>}
      {(done.length > 0 || refund.pending.amountMinor > 0) && (
        <p className="text-[12.5px] text-ink-2">{t("A refund can take 5 to 10 working days to show on your statement.")}</p>
      )}
    </div>
  );
}

export function ClosedStage({ c, request }: { c: Case; request: LawyerRequest }) {
  const t = useT();
  const { data: eligibility } = useEligibilityQuery(c.id);
  const name = request.lawyer?.name;
  // The lawyer stopped acting (a Lawyer Exit): they couldn't continue, rather than finished the work.
  const exited = !!request.refund?.lawyerExit;
  return (
    <div className="flex flex-col gap-4">
      <section className={CARD}>
        <h2 className={HEADING}>{exited ? t("{name} can't continue", { name: firstName(name) ?? t("Your lawyer") }) : t("Engagement ended")}</h2>
        <p className="text-ink-soft">
          {exited
            ? t("Your lawyer has stopped acting on your case.")
            : request.closedBy === "CLIENT"
              ? t("You ended this engagement.")
              : request.completion?.confirmedBy === "CLIENT"
                ? t("You confirmed the work is finished.")
                : request.completion?.confirmedBy === "AUTO"
                  ? t("Your lawyer said the work was finished, and it closed after 7 days without an answer.")
                  : t("Your lawyer closed this engagement.")}
          {name && request.engagedAt && request.closedAt && ` ${t("You worked with {name} from {from} to {to}.", { name, from: day(request.engagedAt), to: day(request.closedAt) })}`}{" "}
          {t("They no longer have access to your case; your messages stay below.")}
        </p>
        {request.refund && <RefundSummary refund={request.refund} />}
        {eligibility?.eligible && (
          <>
            {exited && <p className="text-[13px] text-ink-2">{t("You can ask for another lawyer on this case. {name} won't be offered it.", { name: firstName(name) ?? t("This lawyer") })}</p>}
            <Button variant="dark" size="md" className="self-start max-md:w-full" onClick={() => useLawyerRequestForm.getState().openFor(c.id)}>
              {t("Get another lawyer")}
            </Button>
          </>
        )}
      </section>
      {/* The thread stays readable after the engagement ends (ilovelawyer-api#517). */}
      {request.lawyer && <LawyerMessages c={c} requestId={request.id} lawyerName={request.lawyer.name} closed />}
    </div>
  );
}

export function ExpiredStage({ caseId }: { caseId: string }) {
  const t = useT();
  const { data: eligibility } = useEligibilityQuery(caseId);
  return (
    <section className={cn(CARD, "border-error-line")}>
      <h2 className={HEADING}>{t("No lawyer found")}</h2>
      <p className="text-ink-soft">
        {t("No lawyer picked up your request within 48 hours, or no quote was chosen within 7 days. You haven't been charged anything, and any case fee credit stays on your account.")}
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-[18px] text-[13px] text-ink-soft">
        <li>{t("Answering the questions still open in your interview helps lawyers see what you need.")}</li>
        <li>{t("You can send it again any time.")}</li>
      </ul>
      {eligibility?.eligible && (
        <Button variant="dark" size="md" className="self-start max-md:w-full" onClick={() => useLawyerRequestForm.getState().openFor(caseId)}>
          {t("Send it again")}
        </Button>
      )}
    </section>
  );
}

export function StageCard({ c, request, phase }: { c: Case; request: LawyerRequest; phase: Phase }) {
  const t = useT();
  if (phase === "sent") {
    return (
      <section className={CARD}>
        <h2 className={HEADING}>{t("Preparing your request")}</h2>
        <p className="text-ink-soft">{t("We're turning your overview into an anonymised summary — no names except for the conflict check. This takes about a minute; you can leave this page.")}</p>
        <div className="flex flex-col gap-2" aria-hidden>
          <span className="h-2.5 w-[90%] animate-pulse rounded-md bg-chip" />
          <span className="h-2.5 w-3/4 animate-pulse rounded-md bg-chip" />
          <span className="h-2.5 w-3/5 animate-pulse rounded-md bg-chip" />
        </div>
      </section>
    );
  }
  if (phase === "finding") {
    // Asked by name from Find a lawyer: only they have it until routingExpiresAt.
    const named = request.requestedLawyer ? (firstName(request.requestedLawyer.name) ?? request.requestedLawyer.name) : null;
    if (named && request.requestedOnly) {
      return (
        <section className={CARD}>
          <h2 className={HEADING}>{t("Waiting for {name}", { name: named })}</h2>
          <p className="text-ink-soft">{t("Only {name} has an anonymised summary of your case. If they take it up, they'll check for conflicts and send you a quote.", { name: named })}</p>
          <div className="flex flex-wrap gap-2.5">
            <Tile label={t("Sent")}>{formatDateTime(request.createdAt)}</Tile>
            {request.routingExpiresAt && <Tile label={t("{name} has until", { name: named })}>{formatDateTime(request.routingExpiresAt)}</Tile>}
            <Tile label={t("If {name} can't take it", { name: named })}>
              <span className="font-sans text-sm">{t("It goes to other verified lawyers who match, automatically")}</span>
            </Tile>
          </div>
          <span className="text-[12.5px] text-ink-2">{t("We'll email you the moment {name} picks it up.", { name: named })}</span>
        </section>
      );
    }
    return (
      <section className={CARD}>
        <h2 className={HEADING}>{t("Finding the right lawyer")}</h2>
        {named && <p className="text-ink-soft">{t("{name} couldn't take it up, so we've sent it to other verified lawyers who match, as you agreed.", { name: named })}</p>}
        <p className="text-ink-soft">
          {t("Verified lawyers who handle cases like yours have an anonymised summary of your case. Up to {n} can take it up; each checks for conflicts and sends you a quote.", { n: MAX_LAWYERS })}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Tile label={t("Sent")}>{formatDateTime(request.createdAt)}</Tile>
          <Tile label={t("Usually picked up within")}>{t("a day")}</Tile>
        </div>
        <span className="text-[12.5px] text-ink-2">{t("We'll email you the moment a lawyer picks it up.")}</span>
      </section>
    );
  }
  if (phase === "reviewing") {
    const on = request.lawyers.length;
    return (
      <section className={CARD}>
        <h2 className={HEADING}>{on > 1 ? t("{n} lawyers are reviewing your case", { n: on }) : t("A lawyer is reviewing your case")}</h2>
        <p className="text-ink-soft">
          {on > 1
            ? t("Each is checking they don't already act for the other side, then each will send you a quote within 24 hours. You don't need to do anything yet.")
            : t("They're checking they don't already act for the other side, then they'll send you a quote within 24 hours. You don't need to do anything yet.")}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Tile label={t("If they can't take it")}>
            <span className="font-sans text-sm">{t("It goes back to other lawyers automatically")}</span>
          </Tile>
        </div>
        {/* Each lawyer's thread is open from when they take it up, before any quote (phase 5b). */}
        {request.lawyers.map((offer) => (
          <div key={offer.claimId || offer.lawyer.id} className="flex flex-col gap-3">
            <LawyerHeader lawyer={offer.lawyer} />
            <OfferMessages c={c} request={request} offer={offer} />
          </div>
        ))}
      </section>
    );
  }
  return null;
}

/** "What the lawyer can see" and from when. */
export function VisibilityCard({ engaged, since }: { engaged: boolean; since?: string | null }) {
  const t = useT();
  return (
    <section className="flex flex-col gap-2.5 rounded-card border border-line bg-surface px-5 py-[18px]">
      <h3 className="text-[13.5px] font-semibold">{t("What the lawyer can see")}</h3>
      <ul className="flex flex-col gap-2">
        {VISIBILITY(engaged, since).map((v) => (
          <li key={v.text} className="flex items-center gap-2.5 text-[13px]">
            <span
              aria-hidden
              className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", v.yes ? "bg-success-bg text-success-ink" : "bg-chip text-ink-2")}
            >
              {v.yes ? "✓" : "–"}
            </span>
            <span className="flex-1">{v.text}</span>
            <span className="text-xs text-ink-2">{v.when}</span>
            <span className="sr-only">{v.yes ? t("(visible)") : t("(not visible yet)")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
