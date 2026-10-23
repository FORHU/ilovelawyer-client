import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";

// Asking for a lawyer on a case (ilovelawyer-api /api/client/lawyer-requests, the UK client-to-lawyer
// hand-off). Only client accounts reach these routes.

/** Why a case can't have a lawyer (the API's codes). */
export type IneligibleReason = "NOT_UK_CASE" | "PERSONAL_INJURY_EXCLUDED" | "CASE_NOT_PAID" | "REQUEST_ALREADY_OPEN";

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

export function withdrawLawyerRequest(id: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/withdraw`, {});
}

export const lawyerRequestKeys = {
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

/** The case's open request, if there is one (made here or on another device). */
export function useOpenLawyerRequestQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.open(userId, caseId),
    queryFn: async () => (await listLawyerRequests(caseId)).data.find(isOpen) ?? null,
    enabled: !!userId,
    staleTime: 0,
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.all(userId, caseId) }),
  });
}

export function useWithdrawLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (id: string) => withdrawLawyerRequest(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.all(userId, caseId) }),
  });
}

/** Which case the request form is open for (null: closed). */
export const useLawyerRequestForm = create<{ caseId: string | null; openFor: (caseId: string) => void; close: () => void }>((set) => ({
  caseId: null,
  openFor: (caseId) => set({ caseId }),
  close: () => set({ caseId: null }),
}));
