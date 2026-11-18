import { apiFetch } from "@/lib/api/fetch";
import type { PublishedSupportContent, SupportAudience, SupportOutcomeEvent } from "./types";

// The Support Chat's content and statistics (ilovelawyer-api /api/client/support and the public
// /api/support). A signed-in client reads its own menu; a visitor who isn't signed in reads the
// reduced one, with no sign-in needed.

const base = (audience: SupportAudience) => (audience === "SIGNED_IN" ? "/api/client/support" : "/api/support");

export function fetchSupportContent(audience: SupportAudience): Promise<PublishedSupportContent> {
  return apiFetch<PublishedSupportContent>(`${base(audience)}/content`, { skipAuthRefresh: audience === "SIGNED_OUT" });
}

export function postOutcomes(audience: SupportAudience, events: SupportOutcomeEvent[]) {
  return apiFetch<{ ok: true }>(`${base(audience)}/outcomes`, {
    method: "POST",
    body: JSON.stringify({ events }),
    skipAuthRefresh: audience === "SIGNED_OUT",
  });
}
