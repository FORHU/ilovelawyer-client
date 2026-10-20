import { apiFetch } from "@/lib/api/fetch";
import type { Case, CaseArea, CaseDocument, ChatMessage, OtherParty, UkJurisdiction } from "@/lib/types";

// The client app's own routes (/api/client, ilovelawyer-api's client.route.ts). They only answer
// a client account, and always work in that client's personal workspace, so no organization
// header is needed.

export interface NewCase {
  title: string;
  area: CaseArea;
  /** null: it happened outside the UK. */
  ukJurisdiction: UkJurisdiction | null;
  where: string;
  side: "CLAIMANT" | "RESPONDENT" | null;
  others: Omit<OtherParty, "id">[];
}

export interface CaseMessages {
  /** The AI is still answering the last message. */
  replying: boolean;
  messages: ChatMessage[];
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function listCases() {
  return apiFetch<Case[]>("/api/client/cases");
}

export function getCase(id: string) {
  return apiFetch<Case>(`/api/client/cases/${id}`);
}

export function createCase(input: NewCase) {
  return post<Case>("/api/client/cases", input);
}

export function listMessages(caseId: string) {
  return apiFetch<CaseMessages>(`/api/client/cases/${caseId}/messages`);
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
