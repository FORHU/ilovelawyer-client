import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { fetchDeletionCheck } from "./actions-api";
import { fetchSupportContent } from "./api";
import type { SupportAudience } from "./types";

/** Keyed by account as well, so a session that ends without a sign-out never shows the next
 * account the previous one's menu. */
export const supportKeys = {
  all: (userId: string | undefined) => ["support", userId ?? "signed-out"] as const,
  content: (userId: string | undefined, audience: SupportAudience) => [...supportKeys.all(userId), "content", audience] as const,
  deletionCheck: (userId: string | undefined) => [...supportKeys.all(userId), "deletion-check"] as const,
};

/** Published content changes when an admin publishes, not by the minute. */
const CONTENT_STALE_MS = 5 * 60_000;

export function useSupportContentQuery(audience: SupportAudience) {
  const userId = useSession((s) => s.user?.id);
  return useQuery({
    queryKey: supportKeys.content(userId, audience),
    queryFn: () => fetchSupportContent(audience),
    enabled: audience === "SIGNED_OUT" || !!userId,
    staleTime: CONTENT_STALE_MS,
  });
}

/** What stands in the way of deleting or exporting the account, read fresh each time the step is
 * opened: an open request can appear or clear at any moment. */
export function useDeletionCheckQuery() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: supportKeys.deletionCheck(userId), queryFn: fetchDeletionCheck, enabled: !!userId, staleTime: 0, gcTime: 0, retry: false });
}
