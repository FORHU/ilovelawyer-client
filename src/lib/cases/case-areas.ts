import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useSession } from "@/lib/auth/session";
import type { CaseArea } from "@/lib/types";

/** The types of issue a case can be about (GET /api/client/case-areas): switched-on ones only, in
 * the order admins set. */
export function getCaseAreas() {
  return apiFetch<CaseArea[]>("/api/client/case-areas");
}

export function useCaseAreasQuery() {
  const userId = useSession((s) => s.user?.id);
  return useQuery({ queryKey: ["case-areas", userId ?? "signed-out"], queryFn: getCaseAreas, enabled: !!userId, staleTime: 1000 * 60 * 10 });
}
