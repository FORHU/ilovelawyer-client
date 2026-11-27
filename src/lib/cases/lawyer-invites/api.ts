import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import { caseKeys } from "@/lib/cases/queries";

// A client inviting their own lawyer onto a case (ilovelawyer-api /api/client/lawyer-invites,
// client-invites-own-lawyer). Only client accounts reach these routes, and a case ever has at
// most one live invite — creating a new one supersedes any still-pending one.
//
// Response shapes verified against the live API source (case-lawyer-invite.controller.ts,
// case-lawyer-invite.service.ts's InviteStatusDto, and case-lawyer-invite-route.spec.ts), not just
// the plan's description: createLinkInvite AND createEmailInvite both return just
// `{ token, expiresAt }` — never the full invite status — so email's result is
// CreatedLawyerInvite, not CaseLawyerInvite.

/** What GET /lawyer-invites answers: the case's current invite, however it stands, or null once
 * there's never been one or the only one is no longer pending. Never the token (that's only ever
 * handed back once, at creation). */
export interface CaseLawyerInvite {
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  email: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
}

/** What creating a link or email invite answers (both routes, the same shape): the token the
 * client builds the signup URL from themselves, and when it expires. */
export interface CreatedLawyerInvite {
  token: string;
  expiresAt: string;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** The case's current invite, or null when there's none to show (never had one, or the only one
 * has been revoked, accepted or expired). 404s for a case that isn't the caller's own. */
export function getCurrentInvite(caseId: string) {
  return apiFetch<CaseLawyerInvite | null>(`/api/client/lawyer-invites?caseId=${encodeURIComponent(caseId)}`);
}

/** A shareable link invite: the client sends the token themselves (builds the signup URL from
 * it). Revokes any still-pending invite on the case first. */
export function createLinkInvite(caseId: string) {
  return post<CreatedLawyerInvite>("/api/client/lawyer-invites/link", { caseId });
}

/** An invite emailed straight to the lawyer: a signup link locked to their email. Revokes any
 * still-pending invite on the case first. */
export function createEmailInvite(caseId: string, email: string) {
  return post<CreatedLawyerInvite>("/api/client/lawyer-invites/email", { caseId, email });
}

/** Revokes the case's pending invite. 404s when there's none to revoke. */
export function revokeInvite(caseId: string) {
  return post<void>("/api/client/lawyer-invites/revoke", { caseId });
}

export const lawyerInviteKeys = {
  detail: (userId: string | undefined, caseId: string) => [...caseKeys.all(userId), "lawyer-invite", caseId] as const,
};

function useUserId() {
  return useSession((s) => s.user?.id);
}

/** The case's current own-lawyer invite, if any. Polls while it's PENDING, as a fallback for the
 * lawyer accepting it from outside this app (the signup flow on the lawyer app) — same convention
 * as useOpenLawyerRequestQuery's poll for a marketplace request being claimed. */
export function useCaseLawyerInviteQuery(caseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: lawyerInviteKeys.detail(userId, caseId),
    queryFn: () => getCurrentInvite(caseId),
    enabled: !!userId && !!caseId,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 30_000 : false),
  });
}

function invalidateLawyerInvite(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined, caseId: string) {
  queryClient.invalidateQueries({ queryKey: lawyerInviteKeys.detail(userId, caseId) });
}

export function useCreateLinkInviteMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => createLinkInvite(caseId),
    onSettled: () => invalidateLawyerInvite(queryClient, userId, caseId),
  });
}

export function useCreateEmailInviteMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (email: string) => createEmailInvite(caseId, email),
    onSettled: () => invalidateLawyerInvite(queryClient, userId, caseId),
  });
}

export function useRevokeInviteMutation(caseId: string) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: () => revokeInvite(caseId),
    onSettled: () => invalidateLawyerInvite(queryClient, userId, caseId),
  });
}
