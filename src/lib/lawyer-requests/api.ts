import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";
import { useApp } from "@/lib/store";
import type { LawyerStatus } from "@/lib/types";

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

export function withdrawLawyerRequest(id: string) {
  return post<LawyerRequest>(`/api/client/lawyer-requests/${id}/withdraw`, {});
}

export const lawyerRequestKeys = {
  all: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.root(userId), caseId] as const,
  eligibility: (userId: string | undefined, caseId: string) => [...lawyerRequestKeys.all(userId, caseId), "eligibility"] as const,
  /** Every request of the account, newest first. One query feeds the case page, the cases list and the sidebar. */
  list: (userId: string | undefined) => [...lawyerRequestKeys.root(userId), "list"] as const,
  /** Prefix of everything above, for invalidating after a change. */
  root: (userId: string | undefined) => [...caseKeys.all(userId), "lawyer-request"] as const,
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

export function listAllLawyerRequests() {
  return apiFetch<{ total: number; data: LawyerRequest[] }>("/api/client/lawyer-requests?limit=100");
}

/** How often to ask the API for a changed status while a request is open. Replaced by the
 * client-request:updated socket event once the API emits it (client-handoff.ts). */
const POLL_MS = 15_000;

/** All the account's lawyer requests, newest first. Re-read every POLL_MS while one is open, so a
 * status change in the API (matched, expired, withdrawn on another device) shows without a reload. */
export function useLawyerRequestsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerRequestKeys.list(userId),
    queryFn: async () => (await listAllLawyerRequests()).data,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.some(isOpen) ? POLL_MS : false),
  });
}

/** What a case's request means for the screens: the API's status, plus the dev-only mocked
 * "accepted"/"closed" that stand in for a lawyer app until matching exists. */
export function lawyerPhase(
  caseId: string,
  requests: LawyerRequest[] | undefined,
  demo: { status: LawyerStatus; caseId: string | null },
): LawyerStatus {
  const latest = requests?.find((r) => r.caseId === caseId);
  if (!latest) return "none";
  switch (latest.status) {
    case "REQUESTED":
    case "ROUTED":
    case "CLAIMED":
      return demo.caseId === caseId && (demo.status === "accepted" || demo.status === "closed") ? demo.status : "matching";
    case "QUOTED":
    case "CONFIRMED":
    case "ENGAGED":
      return "quoted";
    case "EXPIRED":
      return "expired";
    default:
      return "none"; // WITHDRAWN, CLOSED
  }
}

/** The case's latest request and where it stands. Undefined request while loading or if there is none. */
export function useCaseLawyer(caseId: string) {
  const { data } = useLawyerRequestsQuery();
  const demo = useApp((s) => s.lawyer);
  const request = data?.find((r) => r.caseId === caseId);
  return { request, phase: lawyerPhase(caseId, data, demo), loaded: data !== undefined };
}

/** For lists: the phase of any case. */
export function useLawyerPhaseOf() {
  const { data } = useLawyerRequestsQuery();
  const demo = useApp((s) => s.lawyer);
  return useCallback((caseId: string) => lawyerPhase(caseId, data, demo), [data, demo]);
}

export function useConsentQuery(enabled: boolean) {
  return useQuery({ queryKey: ["lawyer-request-consent"], queryFn: getConsent, enabled, staleTime: 1000 * 60 * 10 });
}

export function useCreateLawyerRequestMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (input: { note: string; consentVersion: string }) => createLawyerRequest({ caseId, ...input, consentAccepted: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.root(userId) }),
  });
}

export function useWithdrawLawyerRequestMutation() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (id: string) => withdrawLawyerRequest(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: lawyerRequestKeys.root(userId) }),
  });
}

/** Which case the request form is open for (null: closed). */
export const useLawyerRequestForm = create<{ caseId: string | null; openFor: (caseId: string) => void; close: () => void }>((set) => ({
  caseId: null,
  openFor: (caseId) => set({ caseId }),
  close: () => set({ caseId: null }),
}));
