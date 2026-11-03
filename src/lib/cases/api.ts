import { apiFetch } from "@/lib/api/fetch";
import type { ClientBudget } from "@/lib/cases/budget";
import type { Case, CaseDocument, CaseIntake, ChatMessage, OtherParty, UkJurisdiction } from "@/lib/types";

// The client app's own routes (/api/client, ilovelawyer-api's client.route.ts). They only answer
// a client account, and always work in that client's personal workspace, so no organization
// header is needed.

/** A new case is free: it starts with the chat credits GET /api/client/pricing names. */
export interface NewCase {
  title: string;
  /** Case area codes, one or more. */
  areas: string[];
  /** null: it happened outside the UK. */
  ukJurisdiction: UkJurisdiction | null;
  where: string;
  side: "CLAIMANT" | "RESPONDENT" | null;
  others: Omit<OtherParty, "id">[];
  /** What happened and what the client wants. Optional. */
  notes?: string;
  /** What they can spend on a lawyer; null: "Not sure" (or, on an edit, clears it). */
  budget?: ClientBudget | null;
}

/** Any of the case's details; what's left out stays as it is (PATCH /api/client/cases/:id). */
export type CaseChanges = Partial<NewCase>;

export interface CaseMessages {
  /** The AI is still answering the last message. */
  replying: boolean;
  messages: ChatMessage[];
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function listCases(archived = false) {
  return apiFetch<Case[]>(`/api/client/cases${archived ? "?archived=true" : ""}`);
}

export function getCase(id: string) {
  return apiFetch<Case>(`/api/client/cases/${id}`);
}

export function createCase(input: NewCase) {
  return post<Case>("/api/client/cases", input);
}

export function updateCase(id: string, changes: CaseChanges) {
  return apiFetch<Case>(`/api/client/cases/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function archiveCase(id: string) {
  return apiFetch<void>(`/api/client/cases/${id}/archive`, { method: "POST" });
}

export function unarchiveCase(id: string) {
  return apiFetch<Case>(`/api/client/cases/${id}/unarchive`, { method: "POST" });
}

/** Also ends any open lawyer request on the case. Refused (409 CASE_HAS_ACTIVE_ENGAGEMENT) while a
 * lawyer is confirmed or engaged. */
export function deleteCase(id: string) {
  return apiFetch<void>(`/api/client/cases/${id}`, { method: "DELETE" });
}

export function listMessages(caseId: string) {
  return apiFetch<CaseMessages>(`/api/client/cases/${caseId}/messages`);
}

/** The Overview tab's content and status — a plain read, no AI call. */
export function getIntake(caseId: string) {
  return apiFetch<CaseIntake>(`/api/client/cases/${caseId}/intake`);
}

/** Update the intake by hand. Two quick requests start one job: the response is always the
 * current state, running or not. The intake also refreshes on its own — after a chat reply,
 * a document finishing, or an edit to the case details — so this is only for "I just told it
 * something and want the overview caught up right now". */
export function refreshIntake(caseId: string) {
  return post<CaseIntake>(`/api/client/cases/${caseId}/intake/refresh`, {});
}

/** The answer is written in the background; listMessages shows it when it's done. `documentIds`
 * are the case's documents to send with it (up to 5), each READY: one still being read gets 409
 * DOCUMENTS_NOT_READY, with a message naming it. */
export function sendMessage(caseId: string, text: string, documentIds?: string[]) {
  return post<{ messageId: string }>(`/api/client/cases/${caseId}/messages`, { text, documentIds });
}

/** Records a voice message: the API signs an S3 URL, the browser PUTs the recording straight to
 * S3, then the API transcribes it and answers like any other message — same two-step shape as
 * uploadDocument above. */
export async function sendVoiceMessage(caseId: string, blob: Blob): Promise<{ messageId: string }> {
  const contentType = blob.type || "audio/webm";
  const { uploadUrl, key } = await post<{ uploadUrl: string; key: string }>(`/api/client/cases/${caseId}/voice-messages/presign`, {
    contentType,
    fileSize: blob.size,
  });
  const put = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": contentType } }).catch((err: unknown) => {
    console.error("Voice message upload to S3 failed", err);
    return null;
  });
  if (put && !put.ok) console.error(`Voice message upload to S3 failed with ${put.status}`);
  if (!put?.ok) throw new Error("Couldn't send that recording. Try again.");
  return post<{ messageId: string }>(`/api/client/cases/${caseId}/voice-messages`, { key });
}

/** Removes the document from the case for good. If it was READY, the overview turns STALE. */
export function deleteDocument(caseId: string, documentId: string) {
  return apiFetch<void>(`/api/client/cases/${caseId}/documents/${documentId}`, { method: "DELETE" });
}

/** A same-origin /files/<token> link that opens the document, good for a few minutes. Ask for a
 * new one each time it's opened. */
export function getDocumentUrl(caseId: string, documentId: string) {
  return apiFetch<{ url: string; expiresAt: string }>(`/api/client/cases/${caseId}/documents/${documentId}/url`);
}

/** Reads a document that couldn't be read (FAILED) again. Anything else gets 409 NOT_FAILED. */
export function retryDocument(caseId: string, documentId: string) {
  return post<CaseDocument>(`/api/client/cases/${caseId}/documents/${documentId}/retry`, {});
}

/** Browsers often give no type for .docx and friends; S3 still needs one to sign. */
function contentTypeOf(file: File) {
  return file.type || "application/octet-stream";
}

/** Uploads one file to the case: the API signs an S3 URL, the browser PUTs the file straight to
 * S3, then the API records it on the case and starts reading it. */
export async function uploadDocument(caseId: string, file: File): Promise<CaseDocument> {
  const contentType = contentTypeOf(file);
  const { uploadUrl, key } = await post<{ uploadUrl: string; key: string }>(`/api/client/cases/${caseId}/documents/presign`, {
    filename: file.name,
    contentType,
    fileSize: file.size,
  });
  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } }).catch((err: unknown) => {
    // A blocked CORS preflight (the bucket not allowing this app's origin) lands here, not as a status.
    console.error(`Upload of ${file.name} to S3 failed`, err);
    return null;
  });
  if (put && !put.ok) console.error(`Upload of ${file.name} to S3 failed with ${put.status}`);
  if (!put?.ok) throw new Error(`Couldn't upload ${file.name}. Try again.`);
  return post<CaseDocument>(`/api/client/cases/${caseId}/documents`, { key, name: file.name, contentType, fileSize: file.size });
}
