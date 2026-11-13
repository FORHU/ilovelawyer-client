import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { fetchSupportContent } from "./api";
import type { SupportAudience } from "./types";

/** Keyed by account as well, so a session that ends without a sign-out never shows the next
 * account the previous one's menu. */
export const supportKeys = {
  all: (userId: string | undefined) => ["support", userId ?? "signed-out"] as const,
  content: (userId: string | undefined, audience: SupportAudience) => [...supportKeys.all(userId), "content", audience] as const,
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
