"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NewCase } from "@/lib/cases/api";
import { budgetFromDraft, type BudgetDraft } from "@/lib/cases/budget";
import { removeDraft } from "@/lib/cases/drafts";
import { composeNotes } from "@/lib/cases/notes";
import { uploadAll, useCreateCaseMutation } from "@/lib/cases/queries";
import { useFailedUploads } from "@/lib/failed-uploads";
import { useApp } from "@/lib/store";
import type { CaseRegion, OtherParty, Side } from "@/lib/types";
import { useWizard } from "@/lib/wizard-store";

/** What the new-case wizard asks for. */
export interface CaseDraft {
  title: string;
  region: CaseRegion | "";
  where: string;
  /** Case area codes, one or more. */
  areas: string[];
  side: Side;
  others: OtherParty[];
  happened: string;
  wants: string;
  budget: BudgetDraft;
}

/** What POST /api/client/cases needs, from the wizard's answers. */
export function newCaseFromDraft(draft: CaseDraft): NewCase {
  return {
    title: draft.title.trim(),
    areas: draft.areas,
    ukJurisdiction: draft.region === "OUTSIDE_UK" || !draft.region ? null : draft.region,
    where: draft.where.trim(),
    side: draft.side || null,
    others: draft.others.filter((o) => o.name.trim()).map(({ name, role }) => ({ name: name.trim(), role })),
    notes: composeNotes({ happened: draft.happened, wants: draft.wants }) || undefined,
    budget: budgetFromDraft(draft.budget),
  };
}

/**
 * Whether the screen that started a create is still showing. A create that finishes after the
 * client has moved on (another page, or a fresh New case) carries on without pulling them back.
 */
export function useStillHere() {
  const here = useRef(true);
  useEffect(() => {
    here.current = true;
    return () => {
      here.current = false;
    };
  }, []);
  return () => here.current;
}

/**
 * Creates the case from the wizard (cases are free), then uploads its files and opens it. A file
 * that didn't upload is kept for a retry on the case's Documents tab. A failed create leaves the
 * wizard as it is, so the client can press the button again.
 */
export function useCreateCaseFromWizard() {
  const router = useRouter();
  const createCase = useCreateCaseMutation();
  const stillHere = useStillHere();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (creating) return;
    setCreating(true);
    setError("");
    const w = useWizard.getState();
    const { round, draftId } = w;
    let created;
    try {
      created = await createCase.mutateAsync(newCaseFromDraft(w));
    } catch (err) {
      setCreating(false);
      return setError(err instanceof Error && err.message ? err.message : "We couldn't create the case. Try again.");
    }
    // It's a case now, not a draft.
    if (draftId) removeDraft(draftId);
    const notUploaded = await uploadAll(created.id, w.files);
    useFailedUploads.getState().set(created.id, notUploaded);
    // A New case pressed meanwhile has its own draft, which isn't this one to clear.
    if (useWizard.getState().round === round) {
      w.reset();
      useWizard.setState({ draftId: null });
    }
    useApp.getState().setBanner(
      notUploaded.length
        ? `Your case is created, but ${notUploaded.map((f) => f.name).join(", ")} didn't upload. You can try ${notUploaded.length === 1 ? "it" : "them"} again from Documents.`
        : `Your case is created with ${created.credits} chat credits.`,
    );
    setCreating(false);
    if (stillHere()) router.push(`/cases/${created.id}`);
  };

  return { create, creating, error };
}
