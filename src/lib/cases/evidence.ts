import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { msg } from "@/lib/i18n/msg";
import type { CaseDocument } from "@/lib/types";
import { uploadDocument } from "./api";
import { caseKeys } from "./queries";
import type { QuestionsState } from "./questions";

// The evidence step after the questions (components/evidence): proof suggested from the client's
// story and answers, added by photo or file, each with a short note. ilovelawyer-api's
// ClientEvidenceSvc keeps the suggestions; this mirrors what it returns.

/** How a suggested proof is best added, and so which button its card shows. */
export type EvidenceSource = "photos" | "files" | "email" | "memo";

export interface EvidenceSuggestion {
  /** Sent as missingEvidenceId with the upload that fills it. */
  id: string;
  title: string;
  why: string;
  source: EvidenceSource;
  state: "OPEN" | "ADDED" | "DISMISSED";
  documentId: string | null;
}

export interface EvidenceState {
  suggestions: EvidenceSuggestion[];
  added: number;
  open: number;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

/** The suggestions, written once with the AI, the same ones after. */
export function startEvidence(caseId: string) {
  return post<EvidenceState>(`/api/client/cases/${caseId}/evidence-suggestions`, {});
}

/** The suggestions without writing any: null when there are none yet. */
export function getEvidence(caseId: string) {
  return apiFetch<EvidenceState | null>(`/api/client/cases/${caseId}/evidence-suggestions`);
}

/** "I don't have this" (true), or taking it back. */
export function setSuggestionDismissed(caseId: string, suggestionId: string, dismissed: boolean) {
  return patch<EvidenceState>(`/api/client/cases/${caseId}/evidence-suggestions/${suggestionId}`, { dismissed });
}

/** The client's own note on a document; empty clears it. */
export function setDocumentNote(caseId: string, documentId: string, note: string) {
  return patch<{ documentId: string; note: string | null; noteBy: "CLIENT" }>(`/api/client/cases/${caseId}/documents/${documentId}/note`, { note });
}

/** Done: the case is read again over the new proof. */
export function evidenceDone(caseId: string) {
  return post<EvidenceState | null>(`/api/client/cases/${caseId}/evidence/done`, {});
}

// ---- What the screen shows ------------------------------------------------------------------

/** Where a document's note is: still being read, waiting for its drafted note, a note to show (the
 * AI's or the client's), no note (the AI had nothing to say, or the client cleared it), or the
 * document couldn't be read. */
export type NoteStatus = "reading" | "drafting" | "note" | "none" | "failed";

/** A note not drafted this long after its document was added isn't coming (the drafting failed,
 * or never ran): the client is offered to write their own instead of a spinner. */
export const NOTE_PATIENCE_MS = 5 * 60 * 1000;

/**
 * `gaveUp`: the screen stopped looking for notes (useEvidence's patience ran out). `at`: when the
 * screen was opened, so a document added long before then isn't waited on again after a reload.
 * Either way a note that hasn't come shows as none, with "Add a note".
 */
export function noteStatusOf(
  doc: Pick<CaseDocument, "status" | "note" | "noteBy"> & { uploadedAt?: string },
  opts: { gaveUp?: boolean; at?: number } = {},
): NoteStatus {
  if (doc.status === "FAILED") return "failed";
  if (doc.status === "PENDING") return "reading";
  if (doc.note) return "note";
  if (doc.noteBy) return "none";
  const old = opts.at !== undefined && !!doc.uploadedAt && opts.at - Date.parse(doc.uploadedAt) > NOTE_PATIENCE_MS;
  return opts.gaveUp || old ? "none" : "drafting";
}

/** The documents still waiting for something to show (being read, or their note being drafted):
 * while there are any, the screen keeps checking. */
export function stillWorking(docs: Pick<CaseDocument, "status" | "note" | "noteBy">[]): boolean {
  return docs.some((d) => {
    const status = noteStatusOf(d);
    return status === "reading" || status === "drafting";
  });
}

/** The button a suggestion's card shows, by how it's best added: photos and files open the file
 * picker, emails open Gmail, and a memo opens the recorder. */
export const SOURCE_ACTION: Record<EvidenceSource, string> = {
  photos: msg("Add photos"),
  files: msg("Add a file"),
  email: msg("Add emails"),
  memo: msg("Record a memo"),
};

/** What the file dialog offers for a suggestion: photos first for "photos", recordings for "memo". */
export const SOURCE_ACCEPT: Partial<Record<EvidenceSource, string>> = {
  photos: "image/*,.heic",
  memo: ".mp3,.m4a,.wav,.mp4,.webm",
};

/** What the browser records in, and the file it becomes: webm in Chrome and Firefox, mp4 audio in
 * Safari. Both are taken by the API and transcribed. Null when the browser can record neither. */
export function memoFormat(isSupported: (type: string) => boolean): { mimeType: string; extension: string } | null {
  if (isSupported("audio/webm")) return { mimeType: "audio/webm", extension: "webm" };
  if (isSupported("audio/mp4")) return { mimeType: "audio/mp4", extension: "m4a" };
  return null;
}

/** "Voice memo 2026-03-05 14.30.webm": named by when it was recorded. */
export function memoName(at: Date, extension: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Voice memo ${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}.${pad(at.getMinutes())}.${extension}`;
}

export interface ChecklistRow {
  label: string;
  value: string;
  vars?: Record<string, string | number>;
  tone: "ok" | "neutral";
}

/** "All set": what the case has, from what's already known, with no AI call. Labels and values are
 * translation keys, filled with `vars`. */
export function checklistOf(input: { questions: QuestionsState | null | undefined; documents: number; evidence: EvidenceState | null | undefined }): ChecklistRow[] {
  const rows: ChecklistRow[] = [{ label: msg("Your story"), value: msg("Told"), tone: "ok" }];
  const q = input.questions;
  if (q && q.total > 0) {
    rows.push(
      q.skipped
        ? { label: msg("Details"), value: msg("{answered} of {total} answered, {skipped} skipped"), vars: { answered: q.answered, total: q.total, skipped: q.skipped }, tone: "neutral" }
        : { label: msg("Details"), value: msg("{answered} of {total} answered"), vars: { answered: q.answered, total: q.total }, tone: "ok" },
    );
  }
  rows.push(
    input.documents === 1
      ? { label: msg("Proof"), value: msg("1 document"), tone: "ok" }
      : { label: msg("Proof"), value: msg("{count} documents"), vars: { count: input.documents }, tone: input.documents ? "ok" : "neutral" },
  );
  const notAdded = input.evidence ? input.evidence.suggestions.filter((s) => s.state !== "ADDED").length : 0;
  if (notAdded) rows.push({ label: msg("Not added"), value: msg("{count} for your lawyer to ask about"), vars: { count: notAdded }, tone: "neutral" });
  return rows;
}

// ---- Queries ----------------------------------------------------------------------------------

function useUserId() {
  return useSession((s) => s.user?.id);
}

export const evidenceKey = (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "evidence", caseId] as const;
/** The plain read's own entry, kept apart from evidenceKey (whose read writes the suggestions). */
export const evidenceStatusKey = (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "evidence-status", caseId] as const;
const missingEvidenceKey = (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "missing-evidence", caseId] as const;

/** The case's suggestions. The first read writes them (one AI call), so it isn't repeated on focus. */
export function useEvidenceQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: evidenceKey(userId, caseId),
    queryFn: () => startEvidence(caseId),
    enabled: !!userId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, err) => count < 1 && !(err instanceof ApiError && err.status < 500),
  });
}

/** The suggestions without starting them, for the case page. */
export function useEvidenceStatusQuery(caseId: string, enabled = true) {
  const userId = useUserId();
  return useQuery({ queryKey: evidenceStatusKey(userId, caseId), queryFn: () => getEvidence(caseId), enabled: !!userId && enabled, staleTime: 30_000 });
}

/** What changes when proof is added, removed or noted: the case (its documents), the suggestions
 * (which are filled), the Documents tab's gaps and the intake. */
function useRefreshEvidence(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: evidenceKey(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: evidenceStatusKey(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: missingEvidenceKey(userId, caseId) });
    void queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
  };
}

/** Uploads files, each tagged with the suggestion it fills when added from a card. */
export function useAddEvidenceMutation(caseId: string) {
  const refresh = useRefreshEvidence(caseId);
  return useMutation({
    mutationFn: async ({ files, suggestionId }: { files: File[]; suggestionId?: string }) => {
      const added: CaseDocument[] = [];
      const failed: { file: File; reason: string }[] = [];
      for (const file of files) {
        try {
          added.push(await uploadDocument(caseId, file, suggestionId));
        } catch (err) {
          failed.push({ file, reason: err instanceof Error ? err.message : "Upload failed" });
        }
      }
      return { added, failed };
    },
    onSettled: refresh,
  });
}

export function useDismissSuggestionMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const refresh = useRefreshEvidence(caseId);
  return useMutation({
    mutationFn: ({ suggestionId, dismissed }: { suggestionId: string; dismissed: boolean }) => setSuggestionDismissed(caseId, suggestionId, dismissed),
    onSuccess: (state) => {
      queryClient.setQueryData(evidenceKey(userId, caseId), state);
      refresh();
    },
  });
}

export function useDocumentNoteMutation(caseId: string) {
  const refresh = useRefreshEvidence(caseId);
  return useMutation({
    mutationFn: ({ documentId, note }: { documentId: string; note: string }) => setDocumentNote(caseId, documentId, note),
    onSuccess: refresh,
  });
}

export function useEvidenceDoneMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const refresh = useRefreshEvidence(caseId);
  return useMutation({
    mutationFn: () => evidenceDone(caseId),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) });
      void queryClient.invalidateQueries({ queryKey: caseKeys.lawyerReadiness(userId, caseId) });
    },
  });
}
