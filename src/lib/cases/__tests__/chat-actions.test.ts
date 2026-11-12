import { describe, it, expect } from "vitest";
import { canDeleteMessage, deleteQuestion, pendingTurnId, stopNotice } from "../chat-actions";
import type { ChatMessage } from "@/lib/types";

function msg(id: string, role: "user" | "ai", replyStatus: ChatMessage["replyStatus"] = null): ChatMessage {
  return { id, role, text: id, replyStatus, documentIds: [], createdAt: "2026-11-12T10:00:00Z" };
}

describe("pendingTurnId", () => {
  it("is null when nothing is being answered", () => {
    expect(pendingTurnId([])).toBeNull();
    expect(pendingTurnId([msg("u1", "user", "DONE"), msg("a1", "ai")])).toBeNull();
  });

  it("is the client's message that's waiting on its answer", () => {
    expect(pendingTurnId([msg("u1", "user", "DONE"), msg("a1", "ai"), msg("u2", "user", "PENDING")])).toBe("u2");
  });

  it("ignores the AI's messages", () => {
    expect(pendingTurnId([msg("u1", "user", "PENDING"), msg("a1", "ai", "PENDING")])).toBe("u1");
  });
});

describe("canDeleteMessage", () => {
  it("allows nothing while the AI is answering", () => {
    expect(canDeleteMessage(msg("a1", "ai"), true)).toBe(false);
    expect(canDeleteMessage(msg("u1", "user", "DONE"), true)).toBe(false);
  });

  it("never allows deleting a message that's waiting on its answer", () => {
    expect(canDeleteMessage(msg("u1", "user", "PENDING"), false)).toBe(false);
  });

  it("allows an answer and any finished, failed or stopped message", () => {
    expect(canDeleteMessage(msg("a1", "ai"), false)).toBe(true);
    for (const status of ["DONE", "FAILED", "CANCELLED"] as const) {
      expect(canDeleteMessage(msg("u1", "user", status), false)).toBe(true);
    }
  });
});

describe("stopNotice", () => {
  it("says nothing when the Stop worked", () => {
    expect(stopNotice({ messageId: "u1", replyStatus: "CANCELLED", assistantMessageId: "a1" })).toBe("");
  });

  it("explains a Stop that came too late", () => {
    expect(stopNotice({ messageId: "u1", replyStatus: "DONE" })).toBe("That answer had already finished.");
    expect(stopNotice({ messageId: "u1", replyStatus: "FAILED" })).toBe("That answer had already failed. Your credit was given back.");
  });
});

describe("deleteQuestion", () => {
  it("says a client's message takes its answer along and gets no credit back", () => {
    const q = deleteQuestion(msg("u1", "user", "DONE"));
    expect(q).toContain("and its answer");
    expect(q).toContain("won't get the credit back");
  });

  it("asks only about the answer for an AI message", () => {
    expect(deleteQuestion(msg("a1", "ai"))).toBe("Delete this answer? This can't be undone.");
  });
});
