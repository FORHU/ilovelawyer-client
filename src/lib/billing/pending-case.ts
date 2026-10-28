import type { NewCase } from "@/lib/cases/api";
import { composeNotes } from "@/lib/cases/notes";
import type { CaseRegion, OtherParty, Side } from "@/lib/types";

// A few payment methods (some bank payments) leave the page to finish, then come back to
// /payments/return. The new-case wizard only lives in memory, so its draft is kept here, per
// payment, in sessionStorage (this tab only) until the case is made. Picked files can't be kept:
// only how many there were, to ask the client to add them again.

export interface CaseDraft {
  title: string;
  region: CaseRegion | "";
  where: string;
  /** Case area codes. A draft saved before a case could have several has `area` instead. */
  areas?: string[];
  area?: string;
  side: Side;
  others: OtherParty[];
  /** Absent in a draft saved before these questions existed. */
  happened?: string;
  wants?: string;
  fileCount: number;
}

const draftKey = (paymentId: string) => `ilovelawyer-client:case-draft:${paymentId}`;
const PAID_CASE_KEY = "ilovelawyer-client:paid-case-payment";

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the in-page flow doesn't need it.
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nothing to clean up.
  }
}

export function saveCaseDraft(paymentId: string, draft: CaseDraft) {
  write(draftKey(paymentId), draft);
}

export function readCaseDraft(paymentId: string): CaseDraft | null {
  return read<CaseDraft>(draftKey(paymentId));
}

export function clearCaseDraft(paymentId: string) {
  remove(draftKey(paymentId));
}

/** A case payment that went through but whose case wasn't made (the draft was lost). The next
 * "New case" uses it instead of charging again. */
export function rememberPaidCasePayment(paymentId: string) {
  write(PAID_CASE_KEY, paymentId);
}

export function takePaidCasePayment(): string | null {
  const id = read<string>(PAID_CASE_KEY);
  remove(PAID_CASE_KEY);
  return id;
}

export function peekPaidCasePayment(): string | null {
  return read<string>(PAID_CASE_KEY);
}

/** What POST /api/client/cases needs, from a draft and the payment it's made with. */
export function newCaseFromDraft(paymentId: string, draft: Omit<CaseDraft, "fileCount">): NewCase {
  return {
    paymentId,
    title: draft.title.trim(),
    areas: draft.areas ?? (draft.area ? [draft.area] : []),
    ukJurisdiction: draft.region === "OUTSIDE_UK" || !draft.region ? null : draft.region,
    where: draft.where.trim(),
    side: draft.side || null,
    others: draft.others.filter((o) => o.name.trim()).map(({ name, role }) => ({ name: name.trim(), role })),
    notes: composeNotes({ happened: draft.happened ?? "", wants: draft.wants ?? "" }) || undefined,
  };
}
