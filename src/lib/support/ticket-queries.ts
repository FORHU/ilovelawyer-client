import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { supportKeys } from "./queries";
import { fetchThread, markThreadRead, postMessage } from "./ticket-api";
import { unreadCount } from "./ticket";
import type { SupportThread, SupportTicketContext } from "./types";

const threadKey = (userId: string | undefined) => [...supportKeys.all(userId), "thread"] as const;

/** The client's conversation with the team. A live reply (lib/support/socket.ts) refetches it; the
 * short stale time catches one that arrived while the tab was in the background. */
export function useSupportThreadQuery() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: threadKey(userId), queryFn: fetchThread, enabled: !!userId, staleTime: 30_000, retry: false });
}

/** How many replies from the team are waiting: the red dot on the Guide. Zero until it is known. */
export function useSupportUnread(): number {
  return unreadCount(useSupportThreadQuery().data);
}

/** Refetches the conversation (the live-reply socket has no hook of its own to do it). */
export function useRefetchSupportThread() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return () => queryClient.invalidateQueries({ queryKey: threadKey(userId) });
}

export function usePostSupportMessageMutation() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ body, context }: { body: string; context?: SupportTicketContext }) => postMessage(body, context),
    onSuccess: (thread) => queryClient.setQueryData<SupportThread | null>(threadKey(userId), thread),
  });
}

export function useMarkSupportReadMutation() {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);
  return useMutation({
    mutationFn: markThreadRead,
    onSuccess: () => queryClient.setQueryData<SupportThread | null>(threadKey(userId), (thread) => (thread ? { ...thread, unreadCount: 0 } : thread)),
  });
}
