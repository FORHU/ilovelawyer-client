"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useT } from "@/components/site/language-provider";
import { useSession } from "@/lib/auth/session";
import {
  evidenceKey,
  evidenceStatusKey,
  noteStatusOf,
  stillWorking,
  useAddEvidenceMutation,
  useDismissSuggestionMutation,
  useDocumentNoteMutation,
  useEvidenceDoneMutation,
  useEvidenceQuery,
} from "@/lib/cases/evidence";
import { checkFiles, useLimitsQuery } from "@/lib/cases/limits";
import { caseKeys, useCaseQuery, useDeleteDocumentMutation } from "@/lib/cases/queries";
import { useQuestionsStatusQuery } from "@/lib/cases/questions";
import { useOnline } from "@/lib/use-online";
import type { CaseDocument } from "@/lib/types";

/** How often to look again while a document is being read or its note drafted. */
const WORKING_POLL_MS = 4000;
/** How long to keep looking after the last upload: a note that hasn't come by then isn't coming. */
const WORKING_PATIENCE_MS = 3 * 60 * 1000;

/** A file that didn't upload, kept to try again. */
export interface FailedUpload {
  file: File;
  reason: string;
  suggestionId?: string;
}

/** Everything the evidence screen does, apart from how it's laid out: the suggestions, adding proof
 * (from a card, tagged with it, or freely), what's uploading or failed, notes, removing, and Done. */
export function useEvidence(caseId: string) {
  const t = useT();
  const userId = useSession((s) => s.user?.id);
  const queryClient = useQueryClient();
  const evidence = useEvidenceQuery(caseId);
  const caseQuery = useCaseQuery(caseId);
  const questions = useQuestionsStatusQuery(caseId);
  const { data: limits } = useLimitsQuery();
  const online = useOnline();

  const add = useAddEvidenceMutation(caseId);
  const dismiss = useDismissSuggestionMutation(caseId);
  const note = useDocumentNoteMutation(caseId);
  const done = useEvidenceDoneMutation(caseId);
  const remove = useDeleteDocumentMutation(caseId);

  const [uploading, setUploading] = useState<{ name: string; suggestionId?: string }[]>([]);
  const [failed, setFailed] = useState<FailedUpload[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  // The voice memo recorder and the Gmail picker: closed (undefined), open for no suggestion (null),
  // or open for the suggestion the memo or email will fill.
  const [memoFor, setMemoFor] = useState<string | null | undefined>(undefined);
  const [emailFor, setEmailFor] = useState<string | null | undefined>(undefined);
  // Until when to keep looking for documents being read and notes being drafted.
  const [watchUntil, setWatchUntil] = useState(() => Date.now() + WORKING_PATIENCE_MS);
  // When the screen opened, and whether it has stopped looking: a note that hasn't come by then
  // shows as none ("Add a note") rather than a spinner that never ends (noteStatusOf).
  const [openedAt] = useState(() => Date.now());
  const [gaveUp, setGaveUp] = useState(false);

  // Newest first: what was just added is at the top.
  const documents = [...(caseQuery.data?.documents ?? [])].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const working = stillWorking(documents);
  useEffect(() => {
    if (!working) return;
    const tick = setInterval(() => {
      if (Date.now() > watchUntil) {
        setGaveUp(true);
        return clearInterval(tick);
      }
      void queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
    }, WORKING_POLL_MS);
    return () => clearInterval(tick);
  }, [working, watchUntil, queryClient, userId, caseId]);

  /** `onUploaded` runs once every file went up (none failed). */
  function upload(files: File[], suggestionId?: string, onUploaded?: () => void) {
    if (!online) return;
    const { accepted, rejected: refused } = checkFiles(files, limits);
    setRejected(refused);
    if (!accepted.length) return;
    setError("");
    setUploading((now) => [...now, ...accepted.map((f) => ({ name: f.name, suggestionId }))]);
    add.mutate(
      { files: accepted, suggestionId },
      {
        onSuccess: ({ failed: notUploaded }) => {
          setFailed((now) => [...now, ...notUploaded.map((f) => ({ ...f, suggestionId }))]);
          setWatchUntil(Date.now() + WORKING_PATIENCE_MS);
    setGaveUp(false);
          if (!notUploaded.length) onUploaded?.();
        },
        onError: (err) => setError(err instanceof Error && err.message ? err.message : t("We couldn’t upload that. Try again.")),
        onSettled: () => setUploading((now) => now.filter((u) => !accepted.some((f) => f.name === u.name))),
      },
    );
  }

  /** What an email import changes: the case's documents and which suggestions are filled. */
  const refreshAfterImport = () => {
    void queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: evidenceKey(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: evidenceStatusKey(userId, caseId) });
    setWatchUntil(Date.now() + WORKING_PATIENCE_MS);
    setGaveUp(false);
  };

  return {
    caseId,
    evidence,
    suggestions: evidence.data?.suggestions ?? [],
    memoFor,
    openMemo: (suggestionId: string | null) => setMemoFor(suggestionId),
    closeMemo: () => setMemoFor(undefined),
    /** Adds the recorded memo (tagged with its suggestion), and closes the recorder once it's up. */
    addMemo: (file: File) => upload([file], memoFor ?? undefined, () => setMemoFor(undefined)),
    addingMemo: add.isPending,
    emailFor,
    openEmail: (suggestionId: string | null) => setEmailFor(suggestionId),
    /** Gmail adds to the case itself: on closing, what it added shows here. */
    closeEmail: () => {
      setEmailFor(undefined);
      refreshAfterImport();
    },
    documents,
    /** Where a document's note is, waiting on it only while the screen still looks. */
    noteStatus: (doc: CaseDocument) => noteStatusOf(doc, { gaveUp, at: openedAt }),
    questions: questions.data,
    online,
    uploading,
    failed,
    rejected,
    error,
    finished,
    /** Adds files: from a suggestion's card (tagged with it) or + Add proof. */
    upload,
    retry: (item: FailedUpload) => {
      setFailed((now) => now.filter((f) => f !== item));
      upload([item.file], item.suggestionId);
    },
    forget: (item: FailedUpload) => setFailed((now) => now.filter((f) => f !== item)),
    setDismissed: (suggestionId: string, dismissed: boolean) => dismiss.mutate({ suggestionId, dismissed }),
    dismissing: dismiss.isPending,
    saveNote: (documentId: string, text: string, onSaved: () => void) =>
      note.mutate(
        { documentId, note: text },
        { onSuccess: onSaved, onError: (err) => setError(err instanceof Error && err.message ? err.message : t("We couldn’t save your note. Try again.")) },
      ),
    savingNote: note.isPending,
    remove: (documentId: string) =>
      remove.mutate(documentId, { onError: (err) => setError(err instanceof Error && err.message ? err.message : t("We couldn’t remove that. Try again.")) }),
    removing: remove.isPending,
    /** Done: the case is read again over the new proof, then the checklist shows. */
    finish: () =>
      done.mutate(undefined, {
        onSuccess: () => setFinished(true),
        onError: (err) => setError(err instanceof Error && err.message ? err.message : t("We couldn’t finish just now. Try again.")),
      }),
    finishing: done.isPending,
    addMore: () => setFinished(false),
  };
}

export type EvidenceController = ReturnType<typeof useEvidence>;
