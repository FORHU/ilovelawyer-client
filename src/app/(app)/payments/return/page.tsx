"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { waitForPayment, type PaymentStatus } from "@/lib/billing/api";
import { clearCaseDraft, newCaseFromDraft, readCaseDraft, rememberPaidCasePayment } from "@/lib/billing/pending-case";
import { createCase } from "@/lib/cases/api";
import { caseKeys } from "@/lib/cases/queries";
import { useSession } from "@/lib/auth/session";
import { useApp } from "@/lib/store";

type View = { state: "checking" } | { state: "pending" } | { state: "failed"; message: string; back: string };

/**
 * Where Stripe sends a client back after a payment method that had to leave the page (some bank
 * payments; cards finish inside the payment modal and never come here). Confirms the payment with
 * the API, then finishes what it was for: makes the case from the draft saved before leaving, or
 * shows the topped-up case.
 */
function PaymentReturn() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  const paymentId = useSearchParams().get("paymentId");
  const [view, setView] = useState<View>({ state: "checking" });
  const started = useRef(false);

  const finish = useCallback(
    async (status: PaymentStatus) => {
      const app = useApp.getState();
      if (status.kind === "TOP_UP" && status.caseId) {
        await queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
        app.setBanner(`${status.credits} chat credits added to this case.`);
        return router.replace(`/cases/${status.caseId}`);
      }
      if (status.kind === "CASE" && status.usable) {
        const draft = readCaseDraft(status.paymentId);
        if (!draft) {
          // The draft was in another tab or browser. The next "New case" uses this payment.
          rememberPaidCasePayment(status.paymentId);
          app.setBanner("Your payment went through. Fill in your case details again to finish; you won't be charged again.");
          return router.replace("/cases/new");
        }
        try {
          const created = await createCase(newCaseFromDraft(status.paymentId, draft));
          clearCaseDraft(status.paymentId);
          await queryClient.invalidateQueries({ queryKey: caseKeys.all(userId) });
          app.setBanner(
            draft.fileCount
              ? `Payment received and your case is created. Add your ${draft.fileCount === 1 ? "document" : `${draft.fileCount} documents`} again from Documents: files can't carry over a payment that leaves the page.`
              : `Payment received. Your case is created with ${created.credits} chat credits.`,
          );
          return router.replace(`/cases/${created.id}`);
        } catch {
          rememberPaidCasePayment(status.paymentId);
          app.setBanner("Your payment went through, but we couldn't create the case. Try New case again; you won't be charged twice.");
          return router.replace("/cases/new");
        }
      }
      // A case payment already used (this page opened twice): the case exists.
      router.replace("/cases");
    },
    [queryClient, router, userId],
  );

  const check = useCallback(async () => {
    if (!paymentId) return setView({ state: "failed", message: "This link is missing its payment.", back: "/cases" });
    setView({ state: "checking" });
    try {
      const status = await waitForPayment(paymentId);
      if (status.status === "SUCCEEDED") return finish(status);
      if (status.status === "FAILED") {
        clearCaseDraft(paymentId);
        return setView({
          state: "failed",
          message: status.failureReason ?? "Your payment didn't go through. Nothing was charged.",
          back: status.kind === "TOP_UP" && status.caseId ? `/cases/${status.caseId}` : "/cases/new",
        });
      }
      setView({ state: "pending" });
    } catch (err) {
      setView({ state: "failed", message: err instanceof Error ? err.message : "We couldn't check your payment.", back: "/cases" });
    }
  }, [finish, paymentId]);

  useEffect(() => {
    if (started.current || !userId) return;
    started.current = true;
    void check();
  }, [check, userId]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
        {view.state === "checking" && (
          <>
            <div className="font-display text-[22px] tracking-[-0.02em]">Confirming your payment…</div>
            <div className="text-[13px] text-ink-2">This takes a few seconds.</div>
          </>
        )}
        {view.state === "pending" && (
          <>
            <div className="font-display text-[22px] tracking-[-0.02em]">Still confirming</div>
            <div className="text-[13px] leading-[1.6] text-ink-2">
              Your bank hasn&apos;t confirmed the payment yet. You won&apos;t be charged twice. Check again in a moment.
            </div>
            <Button onClick={() => void check()}>Check again</Button>
          </>
        )}
        {view.state === "failed" && (
          <>
            <ErrorBox message={view.message} />
            <Button variant="outline" onClick={() => router.replace(view.back)}>
              Back
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  // useSearchParams needs a Suspense boundary under cacheComponents.
  return (
    <Suspense>
      <PaymentReturn />
    </Suspense>
  );
}
