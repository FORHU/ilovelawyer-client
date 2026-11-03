import { apiFetch } from "@/lib/api/fetch";
import type { SeenKey } from "./tours";

// Where a user is in each tour is kept by ilovelawyer-api (GET and PUT /api/users/me/tour/:track,
// the same store the lawyer app uses), so it follows them across browsers and devices. A track is
// done when it is COMPLETED (finished) or DISMISSED (skipped).

type TourStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED";

interface TourState {
  status: TourStatus;
  archetype: string | null;
  currentStep: string | null;
  doneSteps: string[];
}

/** The API's name for each thing a user can have seen. Prefixed: the lawyer app has a "cases" track. */
export const TRACK: Record<SeenKey, string> = {
  T0: "client-welcome",
  T1: "client-cases",
  T2: "client-new-case",
  T3: "client-case",
  T4: "client-lawyer",
  T5: "client-chat",
};

export const SEEN_KEYS = Object.keys(TRACK) as SeenKey[];

/** Which tours the API says this user has been through. A track that fails to answer (one the API
 * doesn't know yet, a timeout) is left out; the ones that did answer still count. Rejects only if
 * none did. */
export async function fetchSeen(): Promise<SeenKey[]> {
  const states = await Promise.allSettled(SEEN_KEYS.map((key) => apiFetch<TourState>(`/api/users/me/tour/${TRACK[key]}`)));
  if (states.every((s) => s.status === "rejected")) throw states[0].reason;
  return SEEN_KEYS.filter((_, i) => {
    const s = states[i];
    return s.status === "fulfilled" && (s.value.status === "COMPLETED" || s.value.status === "DISMISSED");
  });
}

/** Saves one tour's outcome. */
export function saveTour(key: SeenKey, status: Exclude<TourStatus, "IN_PROGRESS">, doneSteps: string[] = []) {
  return apiFetch<TourState>(`/api/users/me/tour/${TRACK[key]}`, {
    method: "PUT",
    body: JSON.stringify({ status, archetype: null, currentStep: null, doneSteps }),
  });
}
