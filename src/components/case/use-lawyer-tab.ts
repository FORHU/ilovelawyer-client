"use client";

import { useEffect, useRef, useState } from "react";
import {
  clientRequestStage,
  useConfirmLawyerRequestMutation,
  useDeclineLawyerRequestMutation,
  useWithdrawLawyerRequestMutation,
  type LawyerRequest,
} from "@/lib/lawyer-requests/api";
import { activityOf, canWithdrawIn, phaseOf, showsVisibilityIn } from "@/lib/lawyer-requests/phase";
import type { Case } from "@/lib/types";

/**
 * Whether the client has just paid: true once the request goes from waiting on their payment to
 * ENGAGED while this tab is open, until they dismiss it. Watched here rather than in PayStage, which
 * is gone by then: Stripe's webhook often engages the request (and the socket swaps the stage)
 * before the Payment Element's confirm has even returned.
 */
function useJustPaid(request: LawyerRequest): [boolean, () => void] {
  const awaiting = request.status === "CONFIRMED" && request.awaitingPayment;
  const wasAwaiting = useRef(awaiting);
  const [justPaid, setJustPaid] = useState(false);
  useEffect(() => {
    if (awaiting) {
      wasAwaiting.current = true;
      return;
    }
    if (!wasAwaiting.current || request.status !== "ENGAGED") return;
    wasAwaiting.current = false;
    setJustPaid(true);
  }, [awaiting, request.status]);
  return [justPaid, () => setJustPaid(false)];
}

/** What the Lawyer tab reads and does, shared by its desktop and mobile views. The views only
 * decide how it is laid out. */
export function useLawyerTab(c: Case, request: LawyerRequest) {
  const [justPaid, dismissPaid] = useJustPaid(request);
  const confirm = useConfirmLawyerRequestMutation(c.id);
  const decline = useDeclineLawyerRequestMutation(c.id);
  const withdraw = useWithdrawLawyerRequestMutation(c.id);
  const phase = phaseOf(request);

  return {
    justPaid,
    dismissPaid,
    confirm,
    decline,
    withdraw,
    // Confirm, decline and withdraw all act on the same request, so only one runs at a time.
    deciding: confirm.isPending || decline.isPending,
    // [id]/page.tsx filters "withdrawn" out before mounting this tab at all — this is just so the
    // views can treat the request as one that is still on screen.
    visible: clientRequestStage(request.status) !== "withdrawn",
    phase,
    canWithdraw: canWithdrawIn(phase),
    showVisibility: showsVisibilityIn(phase),
    engaged: phase === "engaged",
    activity: activityOf(request),
  };
}
