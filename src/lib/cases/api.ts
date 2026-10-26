import { apiFetch } from "@/lib/api/fetch";
import type { Case, CaseArea, CaseDocument, CaseOverview, ChatMessage, OtherParty, UkJurisdiction } from "@/lib/types";

// The client app's own routes (/api/client, ilovelawyer-api's client.route.ts). They only answer
// a client account, and always work in that client's personal workspace, so no organization
// header is needed.

export interface NewCase {
  /** The case payment this case uses up (POST /api/client/payments/case). */
  paymentId: string;
  title: string;
  area: CaseArea;
  /** null: it happened outside the UK. */
  ukJurisdiction: UkJurisdiction | null;
  where: string;
  side: "CLAIMANT" | "RESPONDENT" | null;
  others: Omit<OtherParty, "id">[];
  /** What happened and what the client wants. Optional. */
  notes?: string;
}

/** Any of the case's details; what's left out stays as it is (PATCH /api/client/cases/:id). */
export type CaseChanges = Partial<Omit<NewCase, "paymentId">>;

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
export function getOverview(caseId: string) {
  return apiFetch<CaseOverview>(`/api/client/cases/${caseId}/overview`);
}

/** Generate (first run) or Update (after STALE) the overview. Two quick requests start one job:
 * the response is always the current state, running or not. */
export function generateOverview(caseId: string) {
  return post<CaseOverview>(`/api/client/cases/${caseId}/overview/generate`, {});
}

/** The answer is written in the background; listMessages shows it when it's done. */
export function sendMessage(caseId: string, text: string) {
  return post<{ messageId: string }>(`/api/client/cases/${caseId}/messages`, { text });
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
  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": contentType } }).catch(() => null);
  if (!put?.ok) throw new Error(`Couldn't upload ${file.name}. Try again.`);
  return post<CaseDocument>(`/api/client/cases/${caseId}/documents`, { key, name: file.name, contentType, fileSize: file.size });
}
