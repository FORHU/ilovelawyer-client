"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorBox } from "@/components/ui/banner";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api/fetch";
import { useArchiveCaseMutation, useDeleteCaseMutation } from "@/lib/cases/queries";
import { useApp } from "@/lib/store";
import type { Case } from "@/lib/types";

export type RemoveMode = "archive" | "delete";

/** Setting a case aside, or deleting it, with the consequences said first. Mounted only while open. */
export function RemoveCaseModal({ c, mode, onClose }: { c: Case; mode: RemoveMode; onClose: () => void }) {
  const router = useRouter();
  const archive = useArchiveCaseMutation();
  const remove = useDeleteCaseMutation();
  const [error, setError] = useState("");
  const [blockedByLawyer, setBlockedByLawyer] = useState(false);
  const mutation = mode === "archive" ? archive : remove;
  const deleting = mode === "delete";

  const confirm = () => {
    setError("");
    setBlockedByLawyer(false);
    mutation.mutate(c.id, {
      onSuccess: () => {
        // A request the API just withdrew for this case leaves the Lawyer tab's local state too.
        useApp.getState().syncLawyerRequest(c.id, null);
        useApp.getState().setBanner(deleting ? "Case deleted." : "Case archived. You can restore it from your cases list.");
        onClose();
        router.push("/cases");
      },
      onError: (err) => {
        setBlockedByLawyer(err instanceof ApiError && err.code === "CASE_HAS_ACTIVE_ENGAGEMENT");
        setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      },
    });
  };

  return (
    <Modal open onClose={onClose} locked={mutation.isPending} title={deleting ? "Delete this case?" : "Archive this case?"} subtitle={c.title}>
      {deleting ? (
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-[1.5] text-ink-2">
          <li>
            The AI chat and {c.documents.length === 1 ? "the 1 document" : `all ${c.documents.length} documents`} are deleted for good.
          </li>
          <li>Any open lawyer request on this case is withdrawn.</li>
          <li>Your {c.credits} remaining chat credits are lost. They aren&apos;t refunded.</li>
        </ul>
      ) : (
        <p className="text-[13.5px] leading-[1.5] text-ink-2">
          The case moves out of your list and stays safe, with its chat, documents and credits. An open lawyer request is withdrawn. You can
          restore it any time.
        </p>
      )}
      {error && <ErrorBox message={error} />}
      {blockedByLawyer && <div className="text-[13px] text-ink-2">Open the Lawyer tab to end the engagement, then come back.</div>}
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant={deleting ? "danger" : "primary"} onClick={confirm} disabled={mutation.isPending}>
          {mutation.isPending ? "Working…" : deleting ? "Delete case" : "Archive case"}
        </Button>
      </div>
    </Modal>
  );
}
