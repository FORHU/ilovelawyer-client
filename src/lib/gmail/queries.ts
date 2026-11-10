import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, type SessionUser } from "@/lib/auth/session";
import { connectGmail, disconnectGmail, getGmailMessage, needsGmailConnect, searchGmail } from "./api";

// TanStack Query hooks for the client's Gmail. The request functions live in ./api.ts.

/** Keyed by account, so a session that ends without a sign-out never shows the next account the
 * previous one's inbox. */
export const gmailKeys = {
  all: (userId: string | undefined) => ["gmail", userId ?? "signed-out"] as const,
  search: (userId: string | undefined, q: string) => [...gmailKeys.all(userId), "search", q] as const,
  message: (userId: string | undefined, id: string) => [...gmailKeys.all(userId), "message", id] as const,
};

function useUserId() {
  return useSession((s) => s.user?.id);
}

/** Connect and disconnect answer with the updated user; the session takes it as is, and any
 * inbox data cached for the old connection is dropped. */
function useApplyUser() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return (user: SessionUser) => {
    useSession.getState().setUser(user);
    queryClient.removeQueries({ queryKey: gmailKeys.all(userId) });
  };
}

export function useConnectGmailMutation() {
  const apply = useApplyUser();
  return useMutation({ mutationFn: (code: string) => connectGmail(code), onSuccess: apply });
}

export function useDisconnectGmailMutation() {
  const apply = useApplyUser();
  return useMutation({ mutationFn: disconnectGmail, onSuccess: apply });
}

/** When the API says the grant is gone, it has already forgotten it, so the session follows and
 * the app shows Connect again. */
function useForgetGmailOn(error: unknown) {
  useEffect(() => {
    if (!needsGmailConnect(error)) return;
    const { user, setUser } = useSession.getState();
    if (user?.gmailConnected) setUser({ ...user, gmailConnected: false, gmailEmail: null });
  }, [error]);
}

/** Pages of the inbox matching `q` (Gmail search syntax). Only runs while Gmail is connected and
 * `enabled`; results stay fresh for a minute so going back to the list doesn't search again. */
export function useGmailSearch(q: string, enabled = true) {
  const userId = useUserId();
  const connected = useSession((s) => !!s.user?.gmailConnected);
  const query = useInfiniteQuery({
    queryKey: gmailKeys.search(userId, q),
    queryFn: ({ pageParam }) => searchGmail(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextPageToken ?? undefined,
    enabled: enabled && connected,
    staleTime: 60_000,
    retry: (count, err) => !needsGmailConnect(err) && count < 1,
  });
  useForgetGmailOn(query.error);
  return query;
}

export function useGmailMessage(id: string | null) {
  const userId = useUserId();
  const query = useQuery({
    queryKey: gmailKeys.message(userId, id ?? ""),
    queryFn: () => getGmailMessage(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: (count, err) => !needsGmailConnect(err) && count < 1,
  });
  useForgetGmailOn(query.error);
  return query;
}
