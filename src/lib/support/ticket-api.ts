import { apiFetch } from "@/lib/api/fetch";
import type { SupportThread, SupportTicketContext } from "./types";

// A Support Ticket (ilovelawyer-api /api/client/support/ticket and the public /api/support/tickets).

/** The open (or latest) conversation, or null if the client has never written. */
export const fetchThread = () => apiFetch<SupportThread | null>("/api/client/support/ticket");

/** Sends a message. It joins the open ticket, or opens a new one carrying the context. */
export const postMessage = (body: string, context?: SupportTicketContext) =>
  apiFetch<SupportThread>("/api/client/support/ticket/messages", { method: "POST", body: JSON.stringify({ body, ...(context ? { context } : {}) }) });

/** The client has opened the team's replies. */
export const markThreadRead = () => apiFetch<void>("/api/client/support/ticket/read", { method: "POST", body: "{}" });

/** A visitor's message. Always answers the same, whether or not the address has an account. */
export const openVisitorTicket = (input: { email: string; message: string; turnstileToken: string; context?: SupportTicketContext }) =>
  apiFetch<{ ok: true }>("/api/support/tickets", { method: "POST", body: JSON.stringify(input), skipAuthRefresh: true });
