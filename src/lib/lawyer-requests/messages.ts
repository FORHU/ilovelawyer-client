import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import type { EngagementMessage, EngagementThreadPage } from "@/lib/client-handoff";
import { lawyerRequestKeys } from "./api";

// The client's thread with one lawyer (ilovelawyer-api#517, /api/client/lawyer-requests/:id/messages):
// one per lawyer on the request since phase 5b, named by their claimId; without one, the hired
// lawyer's. It opens when the lawyer joins and stays readable once they leave or the engagement
// closes. The lawyer's new messages arrive as engagement:message on the hand-off socket, which
// refetches the request and these queries (socket.ts). A thread is short, so it's read whole.

const THREAD_LIMIT = 200;

const messagesKey = (userId: string | undefined, requestId: string, claimId?: string) =>
  [...lawyerRequestKeys.detail(userId, requestId), "messages", claimId ?? "hired"] as const;
const threadPath = (requestId: string, path = "", claimId?: string) =>
  `/api/client/lawyer-requests/${requestId}/messages${path}${claimId ? `?claimId=${claimId}` : ""}`;

export function useEngagementMessagesQuery(requestId: string, claimId?: string) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: messagesKey(userId, requestId, claimId),
    queryFn: () =>
      apiFetch<EngagementThreadPage>(`/api/client/lawyer-requests/${requestId}/messages?limit=${THREAD_LIMIT}${claimId ? `&claimId=${claimId}` : ""}`),
  });
}

export function usePostEngagementMessageMutation(requestId: string, claimId?: string) {
  const userId = useSession((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body?: string; documentId?: string }) =>
      apiFetch<EngagementMessage>(threadPath(requestId, "", claimId), { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesKey(userId, requestId, claimId) }),
  });
}

/** The lawyer's messages up to now stop counting as unread. */
export function useMarkEngagementMessagesReadMutation(requestId: string, claimId?: string) {
  const userId = useSession((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(threadPath(requestId, "/read", claimId), { method: "POST" }),
    onSuccess: () =>
      queryClient.setQueryData<EngagementThreadPage>(messagesKey(userId, requestId, claimId), (page) => (page ? { ...page, unread: 0 } : page)),
  });
}
