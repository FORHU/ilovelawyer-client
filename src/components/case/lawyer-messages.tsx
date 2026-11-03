"use client";

import { Responsive } from "@/components/device/responsive";
import type { Case } from "@/lib/types";
import { LawyerMessagesDesktop } from "./lawyer-messages.desktop";
import { LawyerMessagesMobile } from "./lawyer-messages.mobile";

export interface LawyerMessagesProps {
  c: Case;
  requestId: string;
  lawyerName: string;
  closed: boolean;
  /** The lawyer's thread; left out, the hired lawyer's. */
  claimId?: string;
  beforeHire?: boolean;
}

/**
 * The thread with one lawyer (FORHU/ilovelawyer-client#21, ilovelawyer-api#517). With the lawyer
 * they hired, the client can write, share a document already on the case (the lawyer sees who
 * shared it and when), or both. Since phase 5b each lawyer on the request has a thread from when they
 * join (`claimId`, `beforeHire`): text only, the lawyer sees an anonymised summary and not the
 * client's name, and a hint asks not to share contact details. Seeing the thread marks it read.
 * Read-only once the engagement has closed.
 *
 * On a desktop the thread is on the page; on a phone the page has a card for it and the thread opens
 * as a full screen of its own (use-lawyer-messages is the shared part).
 */
export function LawyerMessages(props: LawyerMessagesProps) {
  return <Responsive desktop={<LawyerMessagesDesktop {...props} />} mobile={<LawyerMessagesMobile {...props} />} />;
}
