import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import type { EngagementMessage, EngagementThreadPage } from "@/lib/client-handoff";
import { lawyerRequestKeys } from "./api";

// The thread with the engaged lawyer (ilovelawyer-api#517, /api/client/lawyer-requests/:id/messages):
// read while ENGAGED or CLOSED, post while ENGAGED. The lawyer's new messages arrive as
// engagement:message on the hand-off socket, which refetches this query (socket.ts). A thread is
// short, so it's read whole.

const THREAD_LIMIT = 200;

const messagesKey = (userId: string | undefined, requestId: string) => [...lawyerRequestKeys.detail(userId, requestId), "messages"] as const;

export function useEngagementMessagesQuery(requestId: string) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: messagesKey(userId, requestId),
    queryFn: () => apiFetch<EngagementThreadPage>(`/api/client/lawyer-requests/${requestId}/messages?limit=${THREAD_LIMIT}`),
  });
}

export function usePostEngagementMessageMutation(requestId: string) {
  const userId = useSession((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body?: string; documentId?: string }) =>
      apiFetch<EngagementMessage>(`/api/client/lawyer-requests/${requestId}/messages`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesKey(userId, requestId) }),
  });
}

/** The lawyer's messages up to now stop counting as unread. */
export function useMarkEngagementMessagesReadMutation(requestId: string) {
  const userId = useSession((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/client/lawyer-requests/${requestId}/messages/read`, { method: "POST" }),
    onSuccess: () =>
      queryClient.setQueryData<EngagementThreadPage>(messagesKey(userId, requestId), (page) => (page ? { ...page, unread: 0 } : page)),
  });
}
