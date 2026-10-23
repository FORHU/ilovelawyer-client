import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";

// Asking for a lawyer on a case (ilovelawyer-api /api/client/lawyer-requests, the UK client-to-lawyer
// hand-off). Only client accounts reach these routes.

/** Why a case can't have a lawyer (the API's codes). */
export type IneligibleReason = "NOT_UK_CASE" | "PERSONAL_INJURY_EXCLUDED" | "CASE_NOT_PAID" | "REQUEST_ALREADY_OPEN" | "REQUEST_LIMIT_REACHED";

/** A request using one of the client's slots. */
export interface OpenRequestSlot {
  requestId: string;
  caseId: string;
  caseTitle: string;
  status: LawyerRequestStatus;
  /** Not after a lawyer has confirmed: those can't be replaced. */
  canWithdraw: boolean;
}

export interface LawyerRequestEligibility {
  eligible: boolean;
  reason: IneligibleReason | null;
  /** Set with REQUEST_ALREADY_OPEN. */
  openRequestId: string | null;
  /** Set with REQUEST_LIMIT_REACHED: how many requests the client may have open, and which are. */
  limit?: { max: number; open: OpenRequestSlot[] };
}

/** What the client agrees to. The wording is a draft until a solicitor has reviewed it. */
export interface LawyerRequestConsent {
  version: string;
  consentText: string;
  /** The lawyer pays us for the introduction (SRA). */
  referralDisclosure: string;
}

export type LawyerRequestStatus =
  | "REQUESTED"
  | "ROUTED"
  | "CLAIMED"
  | "QUOTED"
  | "CONFIRMED"
  | "ENGAGED"
  | "CLOSED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface LawyerRequest {
  id: string;
  caseId: string;
  status: LawyerRequestStatus;
  note: string;
  consentVersion: string;
  consentAcceptedAt: string;
  createdAt: string;
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

export function listLawyerRequests(caseId: string) {
  return apiFetch<{ total: number; data: LawyerRequest[] }>(`/api/client/lawyer-requests?caseId=${encodeURIComponent(caseId)}&limit=5`);
}

/** The client's latest requests across all their cases (the lists, which label each case). */
export function listAllLawyerRequests() {
  return apiFetch<{ total: number; data: LawyerRequest[] }>("/api/client/lawyer-requests?limit=100");
}

export function withdrawLawyerRequest(id: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/withdraw`, {});
}

export const lawyerRequestKeys = {
  /** Every case's: one request made or withdrawn changes whether the others can ask (the slots). */
  every: (userId: string | undefined) => [...caseKeys.all(userId), "lawyer-request"] as const,
  all: (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "lawyer-request", caseId] as const,
  eligibility: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "eligibility"] as const,
  open: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "open"] as const,
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
    enabled: !!userId,
    staleTime: 0,
  });
}

/** How often an open request is re-read, so its status follows what the lawyer does (the tab being
 * in the background pauses it). */
const OPEN_REQUEST_POLL_MS = 15_000;

/** Each case's open request by case id, for the lists that label every case with where its request
 * stands. Read from the API (and kept fresh while any is open), never from this browser's state. */
export function useOpenLawyerRequestsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: [...lawyerRequestKeys.every(userId), "open-all"] as const,
    queryFn: async () => {
      const byCase: Record<string, LawyerRequest> = {};
      // Newest first, so the first open one per case is its current request.
      for (const r of (await listAllLawyerRequests()).data) if (isOpen(r) && !byCase[r.caseId]) byCase[r.caseId] = r;
      return byCase;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data && Object.keys(q.state.data).length ? OPEN_REQUEST_POLL_MS : false),
  });
}

/** The case's open request, if there is one (made here or on another device). */
export function useOpenLawyerRequestQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.open(userId, caseId),
    queryFn: async () => (await listLawyerRequests(caseId)).data.find(isOpen) ?? null,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data ? OPEN_REQUEST_POLL_MS : false),
  });
}

/** The case's latest request, open or ended (so an expired or withdrawn one can still be explained). */
export function useLatestLawyerRequestQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: [...lawyerRequestKeys.all(userId, caseId), "latest"] as const,
    queryFn: async () => (await listLawyerRequests(caseId)).data[0] ?? null,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data && isOpen(q.state.data) ? OPEN_REQUEST_POLL_MS : false),
  });
}

export function useConsentQuery(enabled: boolean) {
  return useQuery({ queryKey: ["lawyer-request-consent"], queryFn: getConsent, enabled, staleTime: 1000 * 60 * 10 });
}

export function useCreateLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (input: { note: string; consentVersion: string }) => createLawyerRequest({ caseId, ...input, consentAccepted: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.every(userId) }),
  });
}

export function useWithdrawLawyerRequestMutation() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (id: string) => withdrawLawyerRequest(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.every(userId) }),
  });
}

/** Which case the request form is open for (null: closed). */
export const useLawyerRequestForm = create<{ caseId: string | null; openFor: (caseId: string) => void; close: () => void }>((set) => ({
  caseId: null,
  openFor: (caseId) => set({ caseId }),
  close: () => set({ caseId: null }),
}));

/** Which case the replace picker is open for (null: closed): the case the client asked for a lawyer
 * on while every request slot was in use. */
export const useReplacePicker = create<{ caseId: string | null; openFor: (caseId: string) => void; close: () => void }>((set) => ({
  caseId: null,
  openFor: (caseId) => set({ caseId }),
  close: () => set({ caseId: null }),
}));

/** "Get a lawyer" on a case: the request form, or the replace picker when every request slot is in
 * use. Decided from the case's eligibility, which is what the buttons that call this already show. */
export function useStartLawyerRequest(caseId: string) {
  const { data } = useEligibilityQuery(caseId);
  return () => {
    if (data?.reason === "REQUEST_LIMIT_REACHED") useReplacePicker.getState().openFor(caseId);
    else useLawyerRequestForm.getState().openFor(caseId);
  };
}
