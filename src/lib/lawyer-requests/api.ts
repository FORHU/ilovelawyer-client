import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";
import {
  clientRequestStage,
  clientRequestStatusLabel,
  type ClientRefundSummary,
  type ClientRequestStage,
  type ClientRequestStatus,
  type EngagementCompletion,
  type LawyerRegulator,
  type Money,
  type Quotation,
  type QuotationPaymentStatus,
  type QuoteType,
  type UkJurisdiction,
} from "@/lib/client-handoff";

// Asking for a lawyer on a case (ilovelawyer-api /api/client/lawyer-requests, the UK client-to-lawyer
// hand-off). Only client accounts reach these routes.

export type { ClientRefundSummary, ClientRequestStage, ClientRequestStatus, EngagementCompletion, Quotation };
export { clientRequestStage, clientRequestStatusLabel };

/** Why a case can't have a lawyer (the API's codes). */
export type IneligibleReason = "NOT_UK_CASE" | "PERSONAL_INJURY_EXCLUDED" | "REQUEST_ALREADY_OPEN";

export interface LawyerRequestEligibility {
  eligible: boolean;
  reason: IneligibleReason | null;
  /** Set with REQUEST_ALREADY_OPEN. */
  openRequestId: string | null;
}

/** What the client agrees to. The wording is a draft until a solicitor has reviewed it. */
export interface LawyerRequestConsent {
  version: string;
  consentText: string;
  /** How ilovelawyer is paid: its platform fee comes out of what the lawyer receives, not on top. */
  referralDisclosure: string;
}

/** @deprecated use ClientRequestStatus from "@/lib/client-handoff" */
export type LawyerRequestStatus = ClientRequestStatus;

/** What the client sees of the claiming lawyer, from QUOTED onwards (LawyerPublicProfile). */
export interface LawyerPublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  /** Null for a solo practitioner's personal workspace. */
  firmName: string | null;
  regulator: LawyerRegulator;
  registrationNumber: string;
  /** Names from the lawyer's site's list, which admins edit. */
  practiceAreas: string[];
  qualifiedJurisdictions: UkJurisdiction[];
  languages: string[];
  bio: string;
  firstConsultationFee: Money | null;
  verifiedAt: string;
}

export interface LawyerQuote {
  type: QuoteType;
  /** The amount the lawyer quoted, what the client pays. `Quotation` has the full terms. */
  amount: Money;
  message: string;
  sentAt: string;
}

export interface EngagementFeedback {
  rating: number;
  comment: string | null;
  createdAt: string;
}

/** One lawyer on the request (several lawyers, ilovelawyer-api phase 5): `claimId` is what hiring and
 * declining take; `quote` and `quotation` are null until they've sent one. `quotation` has what the
 * client pays: the lawyer's quote (`total`; the platform fee is deducted from it, on the lawyer's
 * side) and the lawyer's expiry. */
export interface LawyerOffer {
  claimId: string;
  joinedAt: string;
  lawyer: LawyerPublicProfile;
  quote: LawyerQuote | null;
  quotation: Quotation | null;
}

/** One attempt at paying an accepted quotation. */
export interface QuotationPayment {
  id: string;
  quotationId: string;
  status: QuotationPaymentStatus;
  amount: Money;
  serviceFee: Money;
  platformFee: Money;
  refunded: Money;
  provider: "STRIPE" | "DUMMY";
  failureReason: string | null;
  succeededAt: string | null;
  createdAt: string;
}

/** What starting a payment returns: with Stripe, the PaymentIntent the Payment Element confirms;
 * with the dummy provider, null (it has already settled). */
export interface PaymentStart {
  payment: QuotationPayment;
  intent: { clientSecret: string; publishableKey: string } | null;
}

/** LawyerRequestForClient in the contract. */
export interface LawyerRequest {
  id: string;
  caseId: string;
  status: ClientRequestStatus;
  note: string;
  consentVersion: string;
  consentAcceptedAt: string;
  createdAt: string;
  /** Everyone on the request now (up to 3), oldest first, and the one hired. */
  lawyers: LawyerOffer[];
  /** While quotes are open: the request closes if none is chosen by then. */
  pickByAt: string | null;
  /** More lawyers can still take it up: its 48 hours are open and a place is free. Missing from an
   * older API. */
  openToLawyers?: boolean;
  /** The lawyer hired, or until then the only quote; null with several. */
  lawyer: LawyerPublicProfile | null;
  quote: LawyerQuote | null;
  quotation: Quotation | null;
  /** The client accepted a quotation and hasn't paid it yet (CONFIRMED). */
  awaitingPayment: boolean;
  /** Shown again on the quote screen; acknowledged to confirm. */
  referralDisclosure: string | null;
  /** What hiring a lawyer hands over, in the same words as the consent text. Shown with the quotes and on the payment screen. Null until a quote arrives. */
  sharingNotice: string | null;
  engagedAt: string | null;
  closedAt: string | null;
  closedBy: "LAWYER" | "CLIENT" | null;
  feedback: EngagementFeedback | null;
  /** The lawyer the client asked for by name, from Find a lawyer; kept once it has gone wider.
   * Missing from an older API. */
  requestedLawyer?: { id: string; name: string } | null;
  /** Only `requestedLawyer` is offered it, until `routingExpiresAt`. Then, or once they pass, it goes
   * to every matching lawyer. */
  requestedOnly?: boolean;
  /** While ROUTED: when lawyers can no longer take it up. */
  routingExpiresAt?: string | null;
  /** What the client paid the lawyer they hired, and any refunds. `lawyerExit` is set when the lawyer
   * stopped acting (they couldn't continue): where the refund stands, never why. Null until paid
   * through ilovelawyer; missing from an older API. */
  refund?: ClientRefundSummary | null;
  /** The lawyer says the work is finished: confirm it (the engagement closes) or say what's left.
   * Null until they've said it; missing from an older API. */
  completion?: EngagementCompletion | null;
}

/** The lawyer the request form asks by name (Find a lawyer's Request); none asks every matching lawyer. */
export interface RequestedLawyer {
  id: string;
  name: string;
}

/** Still open: not closed, expired or withdrawn. */
export function isOpen(r: Pick<LawyerRequest, "status">) {
  return !["CLOSED", "EXPIRED", "WITHDRAWN"].includes(r.status);
}

export const LAWYER_NOTE_MAX_LENGTH = 1000;

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** An API from before several lawyers (ilovelawyer-api phase 5) sends no `lawyers`, only the one
 * lawyer and their quote: they become the list, so the Lawyer tab works against either. Their
 * claimId is empty, and hiring or declining then sends none, as that API expects. */
export function withLawyers(r: LawyerRequest): LawyerRequest {
  if (Array.isArray(r.lawyers)) return r;
  const lawyers = r.lawyer ? [{ claimId: "", joinedAt: r.createdAt, lawyer: r.lawyer, quote: r.quote, quotation: r.quotation ?? null }] : [];
  return { ...r, lawyers, pickByAt: r.pickByAt ?? null };
}

/** A request from any of the routes below, with `lawyers` always set (withLawyers). */
async function requestFrom(fetched: Promise<LawyerRequest>): Promise<LawyerRequest> {
  return withLawyers(await fetched);
}

export function getEligibility(caseId: string) {
  return apiFetch<LawyerRequestEligibility>(`/api/client/lawyer-requests/eligibility?caseId=${encodeURIComponent(caseId)}`);
}

/** The consent for asking every matching lawyer, or (`direct`) one lawyer by name first. */
export function getConsent(direct = false) {
  return apiFetch<LawyerRequestConsent>(`/api/client/lawyer-requests/consent${direct ? "?direct=true" : ""}`);
}

/** With `lawyerId`, only that lawyer is offered it for 24 hours; then it goes to every matching lawyer. */
export function createLawyerRequest(input: { caseId: string; note: string; consentVersion: string; consentAccepted: true; lawyerId?: string }) {
  return requestFrom(post<LawyerRequest>("/api/client/lawyer-requests", input));
}

/** All the client's requests, newest first, or just one case's with `caseId`. */
export async function listLawyerRequests(caseId?: string) {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}&limit=5` : "?limit=50";
  const page = await apiFetch<{ total: number; data: LawyerRequest[] }>(`/api/client/lawyer-requests${query}`);
  return { ...page, data: page.data.map(withLawyers) };
}

export function getLawyerRequest(id: string) {
  return requestFrom(apiFetch<LawyerRequest>(`/api/client/lawyer-requests/${id}`));
}

export function withdrawLawyerRequest(id: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/withdraw`, {}));
}

/** Hires the lawyer whose quote `claimId` is. */
export function confirmLawyerRequest(id: string, claimId: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/confirm`, { disclosureAcknowledged: true, ...(claimId ? { claimId } : {}) }));
}

/** Starts (or resumes) paying the accepted quotation. "decline" asks the dummy provider to refuse
 * (dev only). */
export function payQuotation(id: string, quotationId: string, testOutcome?: "decline") {
  return post<PaymentStart>(`/api/client/lawyer-requests/${id}/quotations/${quotationId}/payment`, testOutcome ? { testOutcome } : {});
}

/** Where the client's payment for the request stands, checked with Stripe first while it's pending. */
export function getQuotationPayment(id: string) {
  return apiFetch<{ payment: QuotationPayment | null }>(`/api/client/lawyer-requests/${id}/payment`);
}

/** Declines one lawyer's quote; the others stay open. */
export function declineLawyerRequest(id: string, claimId: string, reason?: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/decline`, { ...(claimId ? { claimId } : {}), ...(reason ? { reason } : {}) }));
}

/** The client's side of closing the engagement — same effect as the lawyer closing it. */
export function endLawyerRequest(id: string, reason?: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/end`, reason ? { reason } : {}));
}

/** The lawyer said the work is finished, and the client agrees: the engagement closes. */
export function confirmCompletion(id: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/completion/confirm`, {}));
}

/** The lawyer said the work is finished, and it isn't yet: `reason` (what's left) goes to them. */
export function declineCompletion(id: string, reason: string) {
  return requestFrom(post<LawyerRequest>(`/api/client/lawyer-requests/${id}/completion/decline`, { reason }));
}

export const COMPLETION_REASON_MAX_LENGTH = 1000;

export const lawyerRequestKeys = {
  all: (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "lawyer-request", caseId] as const,
  eligibility: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "eligibility"] as const,
  open: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "open"] as const,
  latest: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "latest"] as const,
  detail: (userId: string | undefined, id: string) => [...(userId ? [userId] : []), "lawyer-request", id] as const,
  openAll: (userId: string | undefined) => [...(userId ? [userId] : []), "lawyer-requests", "open"] as const,
};

function useUserId() {
  return useSession((s) => s.user?.id);
}

/** Whether to offer "Get a lawyer" on a case. Checked fresh each time the case opens, since the
 * answer changes with the chat (a personal injury case is spotted by the lawyer readiness check). */
export function useEligibilityQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.eligibility(userId, caseId),
    queryFn: () => getEligibility(caseId),
    enabled: !!userId && !!caseId,
    staleTime: 0,
  });
}

/** The case's open request, if there is one (made here or on another device). Refetches on an
 * interval while there's an open request, as a fallback alongside the live socket update
 * (lib/lawyer-requests/socket.ts). */
export function useOpenLawyerRequestQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.open(userId, caseId),
    queryFn: async () => (await listLawyerRequests(caseId)).data.find(isOpen) ?? null,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data && isOpen(query.state.data) ? 30_000 : false),
  });
}

/** The case's newest request, whatever its status — unlike useOpenLawyerRequestQuery, this still
 * returns one that just closed, expired or was withdrawn, so the Lawyer tab can show that final
 * state (the "No lawyer found" explanation, #19) instead of silently disappearing the moment it
 * leaves "open". The API already returns newest first. */
export function useLatestLawyerRequestQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.latest(userId, caseId),
    queryFn: async () => (await listLawyerRequests(caseId)).data[0] ?? null,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data && isOpen(query.state.data) ? 30_000 : false),
  });
}

/** Every case's open request at once, by caseId — for a case list or the sidebar, so each row
 * shows its own status instead of all sharing one. */
export function useOpenLawyerRequestsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.openAll(userId),
    queryFn: async () => {
      const open = (await listLawyerRequests()).data.filter(isOpen);
      return new Map(open.map((r) => [r.caseId, r]));
    },
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: 30_000,
  });
}

export function useLawyerRequestQuery(id: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.detail(userId, id ?? ""),
    queryFn: () => getLawyerRequest(id!),
    enabled: !!userId && !!id,
    staleTime: 0,
  });
}

export function useConsentQuery(enabled: boolean, direct = false) {
  return useQuery({ queryKey: ["lawyer-request-consent", direct], queryFn: () => getConsent(direct), enabled, staleTime: 1000 * 60 * 10 });
}

/** Every query a change to one case's request can affect: that case's own keys, plus the
 * cases-list / sidebar's across-all-cases query. Exported for callers outside a mutation here
 * too (e.g. RemoveCaseModal, after the API withdraws a case's open request as a side effect of
 * archiving or deleting it). */
export function invalidateLawyerRequests(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined, caseId: string) {
  queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.all(userId, caseId) });
  queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.openAll(userId) });
}

/** Refetches everything a change to the case's request can affect, for a change made outside these
 * mutations (Stripe taking a payment). */
export function useRefreshLawyerRequests(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return () => invalidateLawyerRequests(queryClient, userId, caseId);
}

export function useCreateLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (input: { note: string; consentVersion: string; lawyerId?: string }) => createLawyerRequest({ caseId, ...input, consentAccepted: true }),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useWithdrawLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (id: string) => withdrawLawyerRequest(id),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useConfirmLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ id, claimId }: { id: string; claimId: string }) => confirmLawyerRequest(id, claimId),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function usePayQuotationMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ id, quotationId, testOutcome }: { id: string; quotationId: string; testOutcome?: "decline" }) => payQuotation(id, quotationId, testOutcome),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useDeclineLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ id, claimId, reason }: { id: string; claimId: string; reason?: string }) => declineLawyerRequest(id, claimId, reason),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useEndLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => endLawyerRequest(id, reason),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useConfirmCompletionMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (id: string) => confirmCompletion(id),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

export function useDeclineCompletionMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => declineCompletion(id, reason),
    onSettled: () => invalidateLawyerRequests(queryClient, userId, caseId),
  });
}

/** Which case the request form is open for (null: closed), and the lawyer it asks by name, if any. */
export const useLawyerRequestForm = create<{
  caseId: string | null;
  lawyer: RequestedLawyer | null;
  openFor: (caseId: string, lawyer?: RequestedLawyer) => void;
  close: () => void;
}>((set) => ({
  caseId: null,
  lawyer: null,
  openFor: (caseId, lawyer) => set({ caseId, lawyer: lawyer ?? null }),
  close: () => set({ caseId: null, lawyer: null }),
}));
