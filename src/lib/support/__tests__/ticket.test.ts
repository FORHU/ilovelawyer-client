import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import { isActiveThread, ticketContext, unreadCount, visitorErrorMessage } from "../ticket";
import type { SupportThread } from "../types";

const thread = (status: SupportThread["status"], unread = 0): SupportThread => ({ id: "t1", status, messages: [], unreadCount: unread });

describe("ticketContext", () => {
  it("sends the help topics tried and the page's path, with no query or hash", () => {
    expect(ticketContext(["credits-how", "topup-missing"], "/settings?section=account#top")).toEqual({
      flowPath: ["credits-how", "topup-missing"],
      page: "/settings",
    });
  });

  it("names the case when the page is one", () => {
    expect(ticketContext([], "/cases/ckx123/overview")).toEqual({ page: "/cases/ckx123/overview", caseId: "ckx123" });
    expect(ticketContext([], "/cases/ckx123")).toMatchObject({ caseId: "ckx123" });
  });

  it("doesn't mistake the new-case page for a case", () => {
    expect(ticketContext([], "/cases/new")).toEqual({ page: "/cases/new" });
    expect(ticketContext([], "/cases")).toEqual({ page: "/cases" });
  });

  it("keeps the last twelve topics and drops ids the API would refuse", () => {
    const many = Array.from({ length: 15 }, (_, i) => `flow-${i}`);
    const sent = ticketContext([...many, "has space", "x".repeat(81)], null).flowPath;
    expect(sent).toHaveLength(12);
    expect(sent?.at(-1)).toBe("flow-14");
    expect(sent).not.toContain("has space");
  });

  it("sends nothing it doesn't have", () => {
    expect(ticketContext([], null)).toEqual({});
  });
});

describe("a conversation", () => {
  it("is active until the team resolves it", () => {
    expect(isActiveThread(thread("OPEN"))).toBe(true);
    expect(isActiveThread(thread("ANSWERED"))).toBe(true);
    expect(isActiveThread(thread("RESOLVED"))).toBe(false);
    expect(isActiveThread(null)).toBe(false);
    expect(isActiveThread(undefined)).toBe(false);
  });

  it("counts the replies waiting, and none when there is no conversation", () => {
    expect(unreadCount(thread("ANSWERED", 2))).toBe(2);
    expect(unreadCount(null)).toBe(0);
  });
});

describe("visitorErrorMessage", () => {
  it("tells a failed captcha apart", () => {
    expect(visitorErrorMessage(new ApiError("x", 400, "CAPTCHA_FAILED"))).toMatch(/not a robot/);
  });

  it("asks the visitor to wait when there have been too many", () => {
    expect(visitorErrorMessage(new ApiError("Too many requests", 429))).toMatch(/wait/);
  });

  it("repeats a validation message, such as a bad email address", () => {
    expect(visitorErrorMessage(new ApiError('"email" must be a valid email', 400))).toBe('"email" must be a valid email');
  });

  it("is plain about anything else", () => {
    expect(visitorErrorMessage(new ApiError("boom", 500))).toMatch(/couldn't send/);
    expect(visitorErrorMessage(new Error("offline"))).toMatch(/couldn't send/);
  });
});
