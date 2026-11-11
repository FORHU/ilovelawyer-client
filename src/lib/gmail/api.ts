import { ApiError, apiFetch, apiFetchBlob } from "@/lib/api/fetch";
import type { SessionUser } from "@/lib/auth/session";
import type { CaseDocument } from "@/lib/types";

// The client's own Gmail, read-only (ilovelawyer-api's /api/client/gmail, EPIC #982). Nothing read
// here is stored: search results, bodies and attachments come straight from Gmail on each call.

/** What the Google popup asks for. Read-only: we can't send, change or delete mail. */
export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export interface GmailSearchRow {
  id: string;
  threadId: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  /** ISO; when Gmail received it. */
  date: string | null;
  snippet: string;
  attachmentNames: string[];
}

export interface GmailSearchPage {
  messages: GmailSearchRow[];
  nextPageToken: string | null;
}

export interface GmailAttachment {
  /** Pass this to the download, not Gmail's own attachment id (that changes on every read). */
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
  /** Shown inside the email body (a pasted picture, a logo) rather than attached. */
  inline: boolean;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string | null;
  to: string | null;
  cc: string | null;
  /** Gmail only has Bcc on mail the client sent. */
  bcc: string | null;
  subject: string | null;
  dateHeader: string | null;
  date: string | null;
  messageIdHeader: string | null;
  snippet: string;
  textBody: string | null;
  htmlBody: string | null;
  attachments: GmailAttachment[];
}

export function connectGmail(code: string) {
  return apiFetch<SessionUser>("/api/client/gmail/connect", { method: "POST", body: JSON.stringify({ code }) });
}

export function disconnectGmail() {
  return apiFetch<SessionUser>("/api/client/gmail", { method: "DELETE" });
}

export function searchGmail(q: string, pageToken?: string) {
  const params = new URLSearchParams({ limit: "20" });
  if (q.trim()) params.set("q", q.trim());
  if (pageToken) params.set("pageToken", pageToken);
  return apiFetch<GmailSearchPage>(`/api/client/gmail/messages?${params}`);
}

export function getGmailMessage(id: string) {
  return apiFetch<GmailMessage>(`/api/client/gmail/messages/${encodeURIComponent(id)}`);
}

/** Fetches one attachment and hands it to the browser as a download. */
export async function downloadGmailAttachment(messageId: string, attachment: GmailAttachment): Promise<void> {
  const { blob, filename } = await apiFetchBlob(
    `/api/client/gmail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.partId)}/download`,
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? attachment.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** An email "Suggest by AI" found for the case, with why. */
export interface GmailSuggestion extends GmailSearchRow {
  /** "high": clearly about the case; "medium": probably related. */
  relevance: "high" | "medium";
  reason: string;
}

/** "Suggest by AI" (EPIC #982, #984): the case's Intake searches the inbox for emails about the
 * case and ranks them. `searched` is how many candidates it looked at. */
export function suggestGmailForCase(caseId: string) {
  return apiFetch<{ matches: GmailSuggestion[]; searched: number }>(`/api/client/cases/${encodeURIComponent(caseId)}/gmail-suggestions`, {
    method: "POST",
  });
}

export interface GmailCaseImport {
  messageId: string;
  /** Add the email itself, as a PDF with its From/To/Cc/Bcc/Date/Subject and text. */
  includeEmail: boolean;
  /** Attachments to add, each as its own case document. */
  attachmentPartIds: string[];
}

/** Adds an email and/or its chosen attachments to the case as documents (EPIC #982, #986/#987).
 * Answers with the new documents, which then read like any upload. */
export function importGmailToCase(caseId: string, input: GmailCaseImport) {
  return apiFetch<{ documents: CaseDocument[] }>(`/api/client/cases/${encodeURIComponent(caseId)}/gmail-imports`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** The API's answer when Gmail isn't connected, or Google stopped accepting the stored grant
 * (revoked by the client in their Google account, or expired). Either way: connect again. */
export function needsGmailConnect(err: unknown): boolean {
  return err instanceof ApiError && (err.code === "GMAIL_NOT_CONNECTED" || err.code === "GMAIL_RECONNECT_REQUIRED");
}
