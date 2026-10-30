import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";
import {
  clientRequestStage,
  clientRequestStatusLabel,
  type ClientRequestStage,
  type ClientRequestStatus,
  type LawyerRegulator,
  type Money,
  type Quotation,
  type QuotationPaymentStatus,
  type QuoteType,
  type UkJurisdiction,
} from "@/lib/client-handoff";

// Asking for a lawyer on a case (ilovelawyer-api /api/client/lawyer-requests, the UK client-to-lawyer
// hand-off). Only client accounts reach these routes.

export type { ClientRequestStage, ClientRequestStatus, Quotation };
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
  /** How ilovelawyer is paid: the platform fee on top of the lawyer's quote. */
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
  /** The lawyer's own fee, paid out to them in full. `Quotation` adds the platform fee and the total. */
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
 * client pays: the lawyer's fee, ilovelawyer's platform fee on top, the total and the lawyer's expiry. */
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
  /** Everyone on the request now, oldest first, and the one hired. */
  lawyers: LawyerOffer[];
  /** While quotes are open: the request closes if none is chosen by then. */
  pickByAt: string | null;
  /** The lawyer hired, or until then the only quote; null with several. */
  lawyer: LawyerPublicProfile | null;
  quote: LawyerQuote | null;
  quotation: Quotation | null;
  /** The client accepted a quotation and hasn't paid it yet (CONFIRMED). */
  awaitingPayment: boolean;
  /** Shown again on the quote screen; acknowledged to confirm. */
  referralDisclosure: string | null;
  engagedAt: string | null;
  closedAt: string | null;
  closedBy: "LAWYER" | "CLIENT" | null;
  feedback: EngagementFeedback | null;
}

/** Still open: not closed, expired or withdrawn. */
export function isOpen(r: Pick<LawyerRequest, "status">) {
  return !["CLOSED", "EXPIRED", "WITHDRAWN"].includes(r.status);
}

export const LAWYER_NOTE_MAX_LENGTH = 1000;

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function getEligibility(caseId: string) {
  return apiFetch<LawyerRequestEligibility>(`/api/client/lawyer-requests/eligibility?caseId=${encodeURIComponent(caseId)}`);
}

export function getConsent() {
  return apiFetch<LawyerRequestConsent>("/api/client/lawyer-requests/consent");
}

export function createLawyerRequest(input: { caseId: string; note: string; consentVersion: string; consentAccepted: true }) {
  return post<LawyerRequest>("/api/client/lawyer-requests", input);
}

/** All the client's requests, newest first, or just one case's with `caseId`. */
export function listLawyerRequests(caseId?: string) {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}&limit=5` : "?limit=50";
  return apiFetch<{ total: number; data: LawyerRequest[] }>(`/api/client/lawyer-requests${query}`);
}

export function getLawyerRequest(id: string) {
  return apiFetch<LawyerRequest>(`/api/client/lawyer-requests/${id}`);
}

export function withdrawLawyerRequest(id: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/withdraw`, {});
}

/** Hires the lawyer whose quote `claimId` is. */
export function confirmLawyerRequest(id: string, claimId: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/confirm`, { disclosureAcknowledged: true, claimId });
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
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/decline`, reason ? { claimId, reason } : { claimId });
}

/** The client's side of closing the engagement — same effect as the lawyer closing it. */
export function endLawyerRequest(id: string, reason?: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/end`, reason ? { reason } : {});
}

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

export function useConsentQuery(enabled: boolean) {
  return useQuery({ queryKey: ["lawyer-request-consent"], queryFn: getConsent, enabled, staleTime: 1000 * 60 * 10 });
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
    mutationFn: (input: { note: string; consentVersion: string }) => createLawyerRequest({ caseId, ...input, consentAccepted: true }),
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

/** Which case the request form is open for (null: closed). */
export const useLawyerRequestForm = create<{ caseId: string | null; openFor: (caseId: string) => void; close: () => void }>((set) => ({
  caseId: null,
  openFor: (caseId) => set({ caseId }),
  close: () => set({ caseId: null }),
}));
