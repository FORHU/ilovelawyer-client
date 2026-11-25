import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import type { CaseIntake } from "@/lib/types";
import { correctStory, getIntake, startStory } from "./api";
import { caseKeys } from "./queries";

// The story-first way into a new case (components/story): the client tells what happened, the API
// makes the case and the AI reads the story, and "Here's your story so far" shows what it took in.

/** The API's limits on a story (ilovelawyer-api CLIENT_STORY_MIN/MAX_LENGTH). */
export const STORY_MIN_LENGTH = 20;
export const STORY_MAX_LENGTH = 8000;
/** How long one spoken recording of a story may run: ten minutes, which fits within
 * STORY_MAX_LENGTH and the API's 20 dictation starts per 10 minutes (four streams). */
export const STORY_SPEECH_MAX_SECONDS = 600;
/** And on a fix to it (CLIENT_STORY_CORRECTION_MAX_LENGTH). */
export const STORY_FIX_MAX_LENGTH = 1500;

/** How often to look while the story is being read. */
const READING_POLL_MS = 1500;
/** After this long, the client may carry on while the reading finishes in the background. */
export const READING_PATIENCE_MS = 45_000;

/** A story line's text in pieces, the **marked** ones bold. Nothing else in it is markup: it's shown
 * as plain text. A `**` left without its pair is kept as written. */
export function storySegments(text: string): { text: string; bold: boolean }[] {
  const parts = text.split("**");
  // An even number of parts means an odd number of markers: one has no pair.
  if (parts.length % 2 === 0) return [{ text, bold: false }];
  return parts.map((part, i) => ({ text: part, bold: i % 2 === 1 })).filter((s) => s.text);
}

export type StoryReading =
  /** Still being read, and not for long. */
  | "reading"
  /** Still being read, longer than the client should wait: they may carry on. */
  | "slow"
  /** Read: what we understood is there to show. */
  | "understood"
  /** Not read (it failed, or no reading could start): the client carries on without it. */
  | "unread";

/** Where the reading of a story is, from the intake and how long it has been going. `lookFailed`:
 * asking for the intake kept failing (after the query's own retries), so there's nothing more to
 * wait for here; the reading may still finish, and shows on the case when it does. */
export function storyReading(intake: CaseIntake | undefined, waitedMs: number, lookFailed = false): StoryReading {
  if (!intake || intake.status === "RUNNING") {
    if (lookFailed) return "unread";
    return waitedMs >= READING_PATIENCE_MS ? "slow" : "reading";
  }
  if (intake.status === "READY" || intake.status === "STALE") return "understood";
  return "unread";
}

function useUserId() {
  return useSession((s) => s.user?.id);
}

/** The intake of the case a story made, polled while it's being read. Shares its cache with the
 * case page's Overview, so landing there after shows the same reading at once. */
export function useStoryIntakeQuery(caseId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: caseKeys.intake(userId, caseId ?? ""),
    queryFn: () => getIntake(caseId!),
    enabled: !!userId && !!caseId,
    refetchInterval: (q) => (q.state.data?.status === "RUNNING" ? READING_POLL_MS : false),
  });
}

export function useStartStoryMutation() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (text: string) => startStory(text),
    onSuccess: (started) => {
      queryClient.setQueryData(caseKeys.detail(userId, started.case.id), started.case);
      queryClient.setQueryData(caseKeys.intake(userId, started.case.id), started.intake);
      queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
    },
  });
}

export function useCorrectStoryMutation(caseId: string | null) {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (text: string) => correctStory(caseId!, text),
    onSuccess: ({ intake }) => {
      queryClient.setQueryData(caseKeys.intake(userId, caseId!), intake);
      queryClient.invalidateQueries({ queryKey: caseKeys.messages(userId, caseId!) });
    },
  });
}

/** The case's details may have changed with the reading (a story case gets a suggested title and
 * type of issue), so its cached copy and the list are read again once it's done. */
export function useRefreshStoryCase() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useCallback(
    (caseId: string) => {
      void queryClient.invalidateQueries({ queryKey: caseKeys.detail(userId, caseId) });
      void queryClient.invalidateQueries({ queryKey: caseKeys.list(userId) });
    },
    [queryClient, userId],
  );
}
