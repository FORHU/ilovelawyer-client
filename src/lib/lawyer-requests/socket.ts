"use client";

import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getAppSocket } from "@/lib/socket";

// Live status for a client's own lawyer requests, on the app's shared socket (lib/socket.ts): a
// claim, quote, confirmation, decline, engagement or close pushes client-request:updated here.
// The REST routes (lib/lawyer-requests/api.ts) stay the source of truth — this is only a prompt
// to refetch, so a missed or dropped event is never fatal. useOpenLawyerRequestQuery's
// refetchInterval is the fallback for a connection that never reconnects.

function isLawyerRequestKey(key: readonly unknown[]): boolean {
  return key.some((k) => typeof k === "string" && k.startsWith("lawyer-request"));
}

/** Every lawyer-request query is a plausible match for a status change we don't otherwise know
 * which case belongs to (the event payload only carries requestId) — cheap and infrequent enough
 * that a broad invalidate beats threading caseId through the event. */
function invalidateLawyerRequestQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ predicate: (query) => isLawyerRequestKey(query.queryKey) });
}

/** Mounted once in AppShell, after useAppSocket (which connects and disconnects the socket). */
export function useLawyerRequestSocket(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sock = getAppSocket();

    const onUpdated = () => invalidateLawyerRequestQueries(queryClient);
    // A reconnect may have missed events while disconnected; refetching everything open catches up.
    const onConnect = () => invalidateLawyerRequestQueries(queryClient);

    sock.on("client-request:updated", onUpdated);
    // The lawyer posted in the engagement thread (#517): the thread's query is a lawyer-request one too.
    sock.on("engagement:message", onUpdated);
    sock.on("connect", onConnect);

    return () => {
      sock.off("client-request:updated", onUpdated);
      sock.off("engagement:message", onUpdated);
      sock.off("connect", onConnect);
    };
  }, [queryClient]);
}
