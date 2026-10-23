"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { ErrorBox } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RadioDot } from "@/components/ui/radio-card";
import { cn } from "@/lib/cn";
import { useCaseQuery } from "@/lib/cases/queries";
import {
  useEligibilityQuery,
  useLawyerRequestForm,
  useReplacePicker,
  useWithdrawLawyerRequestMutation,
  type OpenRequestSlot,
} from "@/lib/lawyer-requests/api";
import { describeStatus } from "@/lib/lawyer-requests/status";
import { useApp } from "@/lib/store";

/** When every request slot is in use and the client asks for a lawyer on another case: lists the
 * requests holding the slots and withdraws the one they pick, then goes on to the request form.
 * Only requests that can still be withdrawn are offered; one a lawyer has confirmed is shown
 * locked. Mounted once in the app shell; opened with useReplacePicker.getState().openFor(caseId). */
export function ReplaceRequestModal() {
  const caseId = useReplacePicker((s) => s.caseId);
  // Keyed by case, so each opening starts with nothing picked.
  return caseId ? <Picker key={caseId} caseId={caseId} /> : null;
}

function Picker({ caseId }: { caseId: string }) {
  const close = useReplacePicker((s) => s.close);
  const { data: target } = useCaseQuery(caseId);
  const { data: eligibility, isFetching } = useEligibilityQuery(caseId);
  const withdraw = useWithdrawLawyerRequestMutation();
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState("");

  const limit = eligibility?.limit;
  const slots = limit?.open ?? [];

  // A slot was freed meanwhile (say, on another device): no need to pick, go on to the form.
  useEffect(() => {
    // Not while refetching: the cached answer may be the one from before the slot was taken.
    if (eligibility?.eligible && !isFetching) {
      close();
      useLawyerRequestForm.getState().openFor(caseId);
    }
  }, [eligibility?.eligible, isFetching, caseId, close]);

  const confirm = () => {
    const slot = slots.find((s) => s.requestId === picked);
    if (!slot || withdraw.isPending) return;
    setError("");
    withdraw.mutate(slot.requestId, {
      onSuccess: () => {
        useApp.getState().cancelLawyerRequest(slot.caseId);
        useApp.getState().setBanner(`Request on "${slot.caseTitle}" withdrawn.`);
        close();
        useLawyerRequestForm.getState().openFor(caseId);
      },
      onError: (err) => setError(err instanceof Error ? err.message : "Couldn't withdraw the request. Try again."),
    });
  };

  const canReplace = slots.some((s) => s.canWithdraw);

  return (
    <Modal
      open
      onClose={close}
      locked={withdraw.isPending}
      title={limit ? `You're using all ${limit.max} lawyer ${limit.max === 1 ? "slot" : "slots"}` : "Get a lawyer"}
      subtitle={
        canReplace
          ? `Withdraw one request to ask for a lawyer${target ? ` on "${target.title}"` : ""}. The case you withdraw from stays, and you can ask again later.`
          : "Every request already has a lawyer confirmed, so none can be replaced. End one from its Lawyer tab to free a slot."
      }
    >
      {error && <ErrorBox message={error} />}
      {!limit ? (
        <div role="status" className="text-sm text-ink-2">
          Checking your requests…
        </div>
      ) : (
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" disabled={withdraw.isPending}>
          <legend className="sr-only">Choose the request to withdraw</legend>
          <div role="radiogroup" aria-label="Choose the request to withdraw" className="flex flex-col gap-2">
            {slots.map((slot) => (
              <SlotRow key={slot.requestId} slot={slot} selected={picked === slot.requestId} onSelect={() => setPicked(slot.requestId)} />
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Button variant="outline" size="lg" onClick={close} disabled={withdraw.isPending} autoFocus>
          {canReplace ? "Keep my requests" : "Close"}
        </Button>
        {canReplace && (
          <Button variant="danger" size="lg" onClick={confirm} disabled={!picked || withdraw.isPending}>
            {withdraw.isPending ? "Withdrawing…" : error ? "Try again" : "Withdraw and continue"}
          </Button>
        )}
      </div>
    </Modal>
  );
}

function SlotRow({ slot, selected, onSelect }: { slot: OpenRequestSlot; selected: boolean; onSelect: () => void }) {
  const view = describeStatus(slot.status);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={!slot.canWithdraw}
      disabled={!slot.canWithdraw}
      onClick={onSelect}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-input border-[1.5px] bg-white px-[14px] py-3 text-left transition-colors",
        selected ? "border-gold" : "border-line",
        !slot.canWithdraw && "cursor-not-allowed bg-subtle opacity-70",
      )}
    >
      {slot.canWithdraw ? <RadioDot on={selected} /> : <Lock size={16} aria-hidden className="shrink-0 text-muted" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{slot.caseTitle}</span>
        <span className="block text-xs text-ink-2">
          {view.title}
          {!slot.canWithdraw && " · Lawyer confirmed, can't be replaced"}
        </span>
      </span>
    </button>
  );
}
