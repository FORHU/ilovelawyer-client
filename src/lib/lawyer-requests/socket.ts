"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/api/config";
import { useSession } from "@/lib/auth/session";

// Live status for a client's own lawyer requests (ilovelawyer-api's Socket.IO, same connection
// and auth as the lawyer app's lib/notifications/socket.ts): a claim, quote, confirmation,
// decline, engagement or close pushes client-request:updated here. The REST routes
// (lib/lawyer-requests/api.ts) stay the source of truth — this is only a prompt to refetch, so a
// missed or dropped event is never fatal. useOpenLawyerRequestQuery's refetchInterval is the
// fallback for a connection that never reconnects.

let socket: Socket | null = null;

/** One socket for the whole app, lazily created. `auth` is a callback so it reads the current
 * access token on every (re)connection attempt, not just the one at creation time — the token
 * rotates on refresh (lib/api/fetch.ts), same reasoning as the lawyer app's socket. */
function getHandoffSocket(): Socket {
  if (socket) return socket;
  socket = io(API_URL, {
    autoConnect: false,
    withCredentials: true,
    auth: (cb) => cb({ token: useSession.getState().accessToken }),
  });
  return socket;
}

function isLawyerRequestKey(key: readonly unknown[]): boolean {
  return key.some((k) => typeof k === "string" && k.startsWith("lawyer-request"));
}

/** Every lawyer-request query is a plausible match for a status change we don't otherwise know
 * which case belongs to (the event payload only carries requestId) — cheap and infrequent enough
 * that a broad invalidate beats threading caseId through the event. */
function invalidateLawyerRequestQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ predicate: (query) => isLawyerRequestKey(query.queryKey) });
}

/** Mounted once in AppShell. Connects while signed in, reconnects on a fresh token, and
 * disconnects on sign-out. */
export function useLawyerRequestSocket(): void {
  const accessToken = useSession((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const sock = getHandoffSocket();

    const onUpdated = () => invalidateLawyerRequestQueries(queryClient);
    // A reconnect may have missed events while disconnected; refetching everything open catches up.
    const onConnect = () => invalidateLawyerRequestQueries(queryClient);

    sock.on("client-request:updated", onUpdated);
    sock.on("connect", onConnect);
    sock.connect();

    return () => {
      sock.off("client-request:updated", onUpdated);
      sock.off("connect", onConnect);
      sock.disconnect();
    };
  }, [accessToken, queryClient]);
}
