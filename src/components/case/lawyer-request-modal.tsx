"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/fetch";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  LAWYER_NOTE_MAX_LENGTH,
  useConsentQuery,
  useCreateLawyerRequestMutation,
  useLawyerRequestForm,
} from "@/lib/lawyer-requests/api";

/** The request form: a note for the lawyer, then the consent (the anonymised summary, names only
 * for the conflict check, the lawyer keeping a copy) and the referral-fee disclosure, which the
 * client must agree to. Sending creates the request (POST /api/client/lawyer-requests). Mounted
 * once in the app shell; opened with useLawyerRequestForm.getState().openFor(caseId). */
export function LawyerRequestModal() {
  const caseId = useLawyerRequestForm((s) => s.caseId);
  // Keyed by case, so each opening starts with an empty form.
  return caseId ? <RequestForm key={caseId} caseId={caseId} /> : null;
}

function RequestForm({ caseId }: { caseId: string }) {
  const close = useLawyerRequestForm((s) => s.close);
  const consent = useConsentQuery(true);
  const create = useCreateLawyerRequestMutation(caseId);
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!consent.data || !agreed || create.isPending) return;
    setError("");
    create.mutate(
      { note: note.trim(), consentVersion: consent.data.version },
      {
        onSuccess: () => {
          close();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === "CONSENT_VERSION_STALE") {
            // The wording changed while the form was open: show the new text and ask again.
            setAgreed(false);
            void consent.refetch();
            setError("The consent wording has just been updated. Please read it again.");
            return;
          }
          setError(err instanceof Error ? err.message : "Couldn't send your request. Try again.");
        },
      },
    );
  };

  return (
    <Modal
      open
      onClose={close}
      locked={create.isPending}
      title="Get a lawyer"
      subtitle="Verified UK lawyers see an anonymised version of your overview — your timeline, goals and questions — and can offer to take your case on."
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lawyer-note" className="text-xs font-semibold text-ink-2">
          Note to the lawyer (optional)
        </label>
        <textarea
          id="lawyer-note"
          value={note}
          maxLength={LAWYER_NOTE_MAX_LENGTH}
          rows={4}
          placeholder="Anything a lawyer should know first. For example, you'd prefer a fixed fee, or there's a deadline coming up."
          onChange={(e) => setNote(e.target.value)}
          className="w-full resize-none rounded-input border border-line-input bg-white px-[14px] py-3 text-[15px] leading-[1.5] text-ink outline-none transition-colors focus:border-ink-2"
        />
        <div className="text-right text-xs text-muted">
          {note.length}/{LAWYER_NOTE_MAX_LENGTH}
        </div>
      </div>

      {consent.error && (
        <div className="flex flex-col gap-2">
          <ErrorBox message="Couldn't load the consent wording." />
          <Button variant="outline" size="sm" onClick={() => void consent.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {consent.data && (
        <div className="flex flex-col gap-3 rounded-input border border-line bg-subtle px-4 py-[14px] text-[13px] leading-[1.6] text-ink-2">
          <div className="whitespace-pre-line">{consent.data.consentText}</div>
          <div className="border-t border-line pt-3 font-medium text-ink">{consent.data.referralDisclosure}</div>
        </div>
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={agreed}
        disabled={!consent.data}
        onClick={() => setAgreed(!agreed)}
        className="group flex cursor-pointer items-start gap-2.5 border-0 bg-transparent p-0 text-left disabled:cursor-default disabled:opacity-60"
      >
        <span className={cn("relative mt-0.5 size-4 shrink-0 border-2 bg-white transition-colors", agreed ? "border-ink" : "border-line group-hover:border-gold")}>
          {agreed && <span className="absolute inset-0.5 bg-ink" />}
        </span>
        <span className="text-[13px] text-ink">I agree to share my case this way.</span>
      </button>

      {error && <ErrorBox message={error} />}

      <Button size="xl" className="w-full disabled:!opacity-60" disabled={!agreed || !consent.data || create.isPending} onClick={submit}>
        {create.isPending ? "Sending…" : error && !error.startsWith("The consent") ? "Try again" : "Send request"}
      </Button>
    </Modal>
  );
}
