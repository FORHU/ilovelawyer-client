"use client";

import Link from "next/link";
import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_REQUEST_STATUSES, clientRequestStatusLabel, type ClientRequestStatus } from "@/lib/client-handoff";
import { formatDateTime } from "@/lib/format";
import { money } from "@/lib/pricing";
import { BLOCKING_ACTION_LABEL, requestHref } from "@/lib/support/deletion-flow";
import { useSupport } from "@/lib/support/store";
import type { SupportActionCard, SupportPayment } from "@/lib/support/types";

const closeSupport = () => useSupport.getState().close();

const row = "flex flex-col gap-1.5 rounded-xl border border-line bg-white px-3.5 py-3";
const caseLink = "min-w-0 break-words text-[14.5px] font-semibold text-ink underline decoration-line-input underline-offset-2 hover:decoration-ink";

/** Words as well as colour and an icon, so the status never depends on seeing a colour. */
const PAYMENT_STATUS: Record<SupportPayment["status"], { label: string; Icon: LucideIcon; tone: string }> = {
  SUCCEEDED: { label: "Paid", Icon: CheckCircle2, tone: "border-success-line bg-success-bg text-success-ink" },
  PENDING: { label: "Waiting for payment", Icon: Clock, tone: "border-warn-line bg-warn-bg text-warn-ink" },
  FAILED: { label: "Didn't go through", Icon: XCircle, tone: "border-error-line bg-error-bg text-error-ink" },
};

function StatusChip({ status }: { status: SupportPayment["status"] }) {
  const { label, Icon, tone } = PAYMENT_STATUS[status];
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-medium", tone)}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}

function PaymentCard({ payment }: { payment: SupportPayment }) {
  return (
    <li className={row}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-ink-2">{payment.kind === "CASE" ? "New case" : "Chat Credits top-up"}</span>
        <StatusChip status={payment.status} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[16px] font-semibold tabular-nums text-ink">{money(payment.amount)}</span>
        <span className="text-[13px] tabular-nums text-ink-2">
          {payment.credits > 0 ? `${payment.credits} credits · ` : ""}
          {formatDateTime(payment.createdAt)}
        </span>
      </div>
      {payment.caseId && (
        <Link href={`/cases/${payment.caseId}`} onClick={closeSupport} className={caseLink}>
          {payment.caseTitle ?? "Open the case"}
        </Link>
      )}
      {payment.status === "FAILED" && payment.failureReason && <p className="text-[13px] leading-[1.5] text-error-ink">{payment.failureReason}</p>}
      {payment.status === "PENDING" && <p className="text-[13px] leading-[1.5] text-ink-2">Still waiting on the payment provider. I&apos;ve checked it just now.</p>}
    </li>
  );
}

const isKnownStatus = (status: string): status is ClientRequestStatus => (CLIENT_REQUEST_STATUSES as readonly string[]).includes(status);

/** What an action found, under the assistant's message. */
export function ActionCardView({ card }: { card: SupportActionCard }) {
  switch (card.kind) {
    case "PAYMENTS":
      return (
        <ul aria-label="Recent payments" className="flex w-full flex-col gap-2">
          {card.payments.map((payment) => (
            <PaymentCard key={payment.paymentId} payment={payment} />
          ))}
        </ul>
      );
    case "CREDITS":
      return (
        <ul aria-label="Chat Credits by case" className="flex w-full flex-col gap-2">
          {card.cases.map((c) => (
            <li key={c.caseId} className={cn(row, "flex-row items-center justify-between gap-3")}>
              <Link href={`/cases/${c.caseId}`} onClick={closeSupport} className={caseLink}>
                {c.title}
              </Link>
              <span className="shrink-0 text-[14px] tabular-nums text-ink-2">
                <span className="text-[16px] font-semibold text-ink">{c.credits}</span> credits
              </span>
            </li>
          ))}
        </ul>
      );
    case "REQUESTS":
      return (
        <ul aria-label="Your lawyer requests" className="flex w-full flex-col gap-2">
          {card.requests.map((r) => (
            <li key={r.id} className={row}>
              <Link href={requestHref(r)} onClick={closeSupport} className={caseLink}>
                {r.caseTitle}
              </Link>
              <span className="text-[13.5px] text-ink">{isKnownStatus(r.status) ? clientRequestStatusLabel(r.status) : r.status}</span>
              {r.lawyerName && <span className="text-[13px] text-ink-2">With {r.lawyerName}</span>}
              {r.expiresAt && <span className="text-[13px] text-ink-2">Open until {formatDateTime(r.expiresAt)}</span>}
            </li>
          ))}
        </ul>
      );
    case "BLOCKING":
      return (
        <ul aria-label="Open lawyer requests" className="flex w-full flex-col gap-2">
          {card.requests.map((r) => (
            <li key={r.id} className={cn(row, "border-error-line")}>
              <span className="break-words text-[14.5px] font-semibold text-ink">{r.caseTitle}</span>
              <span className="text-[13.5px] text-ink-2">{isKnownStatus(r.status) ? clientRequestStatusLabel(r.status) : r.status}</span>
              <Link
                href={requestHref(r)}
                onClick={closeSupport}
                className="mt-1 inline-flex min-h-11 items-center justify-center self-start rounded-full border border-line-chip bg-white px-5 text-[14px] font-medium text-ink hover:border-line-hover"
              >
                {BLOCKING_ACTION_LABEL[r.action]}
                <span className="sr-only">: {r.caseTitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      );
  }
}
