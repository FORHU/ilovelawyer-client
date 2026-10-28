import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { refreshAllChats, refreshForChatEvent } from "../chat-socket";
import { caseKeys } from "../queries";

const USER = "u1";

/** Seeds the cache with fresh data for each key and returns a reader for which are now stale
 * (invalidated) — the ones the socket event would refetch. */
function seed(queryClient: QueryClient, keys: (readonly unknown[])[]) {
  for (const key of keys) queryClient.setQueryData(key, { seeded: true });
  return () =>
    keys
      .filter((key) => queryClient.getQueryState(key)?.isInvalidated)
      .map((key) => JSON.stringify(key));
}

describe("refreshForChatEvent", () => {
  let queryClient: QueryClient;
  let invalidated: () => string[];

  const messagesA = caseKeys.messages(USER, "case-a");
  const messagesB = caseKeys.messages(USER, "case-b");
  const intakeA = caseKeys.intake(USER, "case-a");
  const readinessA = [...caseKeys.all(USER), "lawyer-readiness", "case-a", "m-1"];
  const detailA = caseKeys.detail(USER, "case-a");

  beforeEach(() => {
    queryClient = new QueryClient();
    invalidated = seed(queryClient, [messagesA, messagesB, intakeA, readinessA, detailA]);
  });

  it("chat:done refetches that case's chat, its Overview and its lawyer check, and nothing else", async () => {
    await refreshForChatEvent(queryClient, USER, "chat:done", { caseId: "case-a", messageId: "m-1" });
    expect(invalidated()).toEqual([messagesA, intakeA, readinessA].map((k) => JSON.stringify(k)));
  });

  it("chat:error refetches only that case's chat, which then shows the reply failed", async () => {
    await refreshForChatEvent(queryClient, USER, "chat:error", { caseId: "case-a" });
    expect(invalidated()).toEqual([JSON.stringify(messagesA)]);
  });

  it("an event without a case id (an older API) refetches every chat", async () => {
    await refreshForChatEvent(queryClient, USER, "chat:done", { messageId: "m-1" });
    expect(invalidated()).toEqual([messagesA, messagesB].map((k) => JSON.stringify(k)));
  });
});

describe("refreshAllChats", () => {
  it("refetches every chat of this account only (a reconnect may have missed a reply)", async () => {
    const queryClient = new QueryClient();
    const other = caseKeys.messages("someone-else", "case-a");
    const invalidated = seed(queryClient, [caseKeys.messages(USER, "case-a"), caseKeys.intake(USER, "case-a"), other]);
    await refreshAllChats(queryClient, USER);
    expect(invalidated()).toEqual([JSON.stringify(caseKeys.messages(USER, "case-a"))]);
  });
});
