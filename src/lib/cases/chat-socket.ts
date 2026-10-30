"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { getAppSocket } from "@/lib/socket";
import { caseKeys } from "./queries";

// AI chat replies, on the app's shared socket (lib/socket.ts). The API generates a reply in the
// background (its client chat queue) and, once the reply is saved, pushes chat:done to the
// asker's room; chat:error and chat:cancelled when it isn't. This is the only way the chat learns
// a reply is ready: useMessagesQuery never polls. A missed event is caught by another event, never
// by a timer: every (re)connect refetches every chat, and a tab coming back into focus refetches
// its own (TanStack's refetchOnWindowFocus, with the messages query's staleTime of 0). A reply the
// API never finishes is failed by its stale sweep after 15 minutes, which sends chat:error.

/** What the API's chat:done / chat:error / chat:cancelled carry that this app reads. `caseId` is
 * missing from an API older than this app; then every chat is refetched. */
export interface ChatSocketEvent {
  caseId?: string | null;
  messageId?: string;
}

// chat:voice-transcribed fires once a voice turn's recording has been transcribed, ahead of the
// AI's reply — same refetch (refreshForChatEvent's default branch) so the transcript appears as
// soon as it's ready instead of only once the whole answer is done.
export const CHAT_REPLY_EVENTS = ["chat:done", "chat:error", "chat:cancelled", "chat:voice-transcribed"] as const;
export type ChatReplyEvent = (typeof CHAT_REPLY_EVENTS)[number];

function isMessagesKey(userId: string | undefined, key: readonly unknown[]): boolean {
  const all = caseKeys.all(userId);
  return all.every((part, i) => key[i] === part) && key[all.length] === "messages";
}

/** Every chat this account has open, e.g. after a reconnect. */
export function refreshAllChats(queryClient: QueryClient, userId: string | undefined) {
  return queryClient.invalidateQueries({ predicate: (query) => isMessagesKey(userId, query.queryKey) });
}

/** Refetches what an AI reply's end changes: the chat, and after a finished reply also the
 * Overview (the API refreshes it after each reply) and the lawyer check (asked after each answer). */
export function refreshForChatEvent(
  queryClient: QueryClient,
  userId: string | undefined,
  event: ChatReplyEvent,
  payload: ChatSocketEvent | undefined,
) {
  const caseId = payload?.caseId;
  if (!caseId) return refreshAllChats(queryClient, userId);
  const refreshes = [queryClient.invalidateQueries({ queryKey: caseKeys.messages(userId, caseId) })];
  if (event === "chat:done") {
    refreshes.push(
      queryClient.invalidateQueries({ queryKey: caseKeys.intake(userId, caseId) }),
      queryClient.invalidateQueries({ queryKey: [...caseKeys.all(userId), "lawyer-readiness", caseId] }),
    );
  }
  return Promise.all(refreshes);
}

/** Mounted once in AppShell, after useAppSocket (which connects and disconnects the socket). */
export function useChatSocket(): void {
  const queryClient = useQueryClient();
  const userId = useSession((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;
    const sock = getAppSocket();

    const handlers = CHAT_REPLY_EVENTS.map((event) => {
      const handler = (payload: ChatSocketEvent | undefined) => void refreshForChatEvent(queryClient, userId, event, payload);
      sock.on(event, handler);
      return [event, handler] as const;
    });
    // Anything that finished while the connection was down.
    const onConnect = () => void refreshAllChats(queryClient, userId);
    sock.on("connect", onConnect);

    return () => {
      for (const [event, handler] of handlers) sock.off(event, handler);
      sock.off("connect", onConnect);
    };
  }, [queryClient, userId]);
}
