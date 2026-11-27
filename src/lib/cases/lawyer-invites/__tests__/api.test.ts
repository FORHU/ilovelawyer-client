import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api/fetch";
import { createEmailInvite, createLinkInvite, getCurrentInvite, lawyerInviteKeys, revokeInvite, type CaseLawyerInvite } from "../api";

vi.mock("@/lib/api/fetch", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);

describe("lawyer-invites api", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("createLinkInvite POSTs to /api/client/lawyer-invites/link with caseId and returns the invite", async () => {
    const created = { token: "tok-123", expiresAt: "2026-12-03T00:00:00Z" };
    mockedApiFetch.mockResolvedValue(created);

    const got = await createLinkInvite("case-1");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/client/lawyer-invites/link", {
      method: "POST",
      body: JSON.stringify({ caseId: "case-1" }),
    });
    expect(got).toEqual(created);
  });

  it("createEmailInvite POSTs to /api/client/lawyer-invites/email with caseId and email", async () => {
    const created = { token: "tok-456", expiresAt: "2026-12-03T00:00:00Z" };
    mockedApiFetch.mockResolvedValue(created);

    const got = await createEmailInvite("case-1", "lawyer@example.com");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/client/lawyer-invites/email", {
      method: "POST",
      body: JSON.stringify({ caseId: "case-1", email: "lawyer@example.com" }),
    });
    expect(got).toEqual(created);
  });

  it("getCurrentInvite GETs /api/client/lawyer-invites with the caseId as a query param", async () => {
    const invite: CaseLawyerInvite = { status: "PENDING", email: null, expiresAt: "2026-12-03T00:00:00Z", acceptedAt: null, revokedAt: null };
    mockedApiFetch.mockResolvedValue(invite);

    const got = await getCurrentInvite("case-1");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/client/lawyer-invites?caseId=case-1");
    expect(got).toEqual(invite);
  });

  it("getCurrentInvite encodes a caseId that needs it", async () => {
    mockedApiFetch.mockResolvedValue(null);

    await getCurrentInvite("case/1 ok");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/client/lawyer-invites?caseId=case%2F1%20ok");
  });

  it("revokeInvite POSTs to /api/client/lawyer-invites/revoke with caseId", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await revokeInvite("case-1");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/client/lawyer-invites/revoke", {
      method: "POST",
      body: JSON.stringify({ caseId: "case-1" }),
    });
  });
});

describe("lawyerInviteKeys", () => {
  it("is keyed by caseId", () => {
    const forCaseA = lawyerInviteKeys.detail("user-1", "case-a");
    const forCaseB = lawyerInviteKeys.detail("user-1", "case-b");

    expect(forCaseA).not.toEqual(forCaseB);
    expect(forCaseA).toContain("case-a");
    expect(forCaseB).toContain("case-b");
  });

  it("is keyed by userId too, same as the other case query keys", () => {
    const forUser1 = lawyerInviteKeys.detail("user-1", "case-a");
    const forUser2 = lawyerInviteKeys.detail("user-2", "case-a");

    expect(forUser1).not.toEqual(forUser2);
  });
});
