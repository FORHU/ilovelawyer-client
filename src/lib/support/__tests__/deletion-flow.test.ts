import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import { blockingFromError, isWrongPassword, requestHref, stepAfterCheck } from "../deletion-flow";
import type { SupportBlockingRequest, SupportDeletionCheck } from "../types";

const request = (action: SupportBlockingRequest["action"], status: string): SupportBlockingRequest => ({ id: "r1", caseId: "c1", caseTitle: "Dispute", status, action });
const check = (over: Partial<SupportDeletionCheck> = {}): SupportDeletionCheck => ({ blocking: [], hasPassword: true, creditsRemaining: 0, ...over });

describe("stepAfterCheck", () => {
  it("stops at the open requests, whatever else is true", () => {
    expect(stepAfterCheck(check({ blocking: [request("WITHDRAW", "ROUTED")], hasPassword: false }))).toBe("BLOCKED");
  });

  it("asks a password account for its password", () => {
    expect(stepAfterCheck(check({ hasPassword: true }))).toBe("PASSWORD");
  });

  it("goes straight to the confirmation for a Google account, which has no password", () => {
    expect(stepAfterCheck(check({ hasPassword: false }))).toBe("CONFIRM");
  });
});

describe("blockingFromError", () => {
  it("reads the open requests out of a refused deletion", () => {
    const requests = [request("END", "ENGAGED"), request("REVIEW", "CONFIRMED")];
    const err = new ApiError("Withdraw or end your open lawyer requests before deleting your account.", 409, "OPEN_LAWYER_REQUESTS", { requests });
    expect(blockingFromError(err)).toEqual(requests);
  });

  it("is null for any other error", () => {
    expect(blockingFromError(new ApiError("Password is incorrect", 400))).toBeNull();
    expect(blockingFromError(new ApiError("Already scheduled", 409))).toBeNull();
    expect(blockingFromError(new Error("offline"))).toBeNull();
  });

  it("is an empty list, not a crash, when the API sends no list", () => {
    expect(blockingFromError(new ApiError("x", 409, "OPEN_LAWYER_REQUESTS"))).toEqual([]);
  });
});

describe("the rest", () => {
  it("links a request to its case's Lawyer tab", () => {
    expect(requestHref(request("WITHDRAW", "ROUTED"))).toBe("/cases/c1?tab=lawyer");
  });

  it("tells a wrong password from other failures", () => {
    expect(isWrongPassword(new ApiError("Password is incorrect", 400))).toBe(true);
    expect(isWrongPassword(new ApiError("Password is required to delete your account", 400))).toBe(true);
    expect(isWrongPassword(new ApiError("Something went wrong on our side.", 500))).toBe(false);
    expect(isWrongPassword(new Error("Password"))).toBe(false);
  });
});
