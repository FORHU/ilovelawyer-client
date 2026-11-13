import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../actions-api", () => ({
  checkPayment: vi.fn(),
  showCredits: vi.fn(),
  showLawyerRequests: vi.fn(),
  sendPasswordReset: vi.fn(),
}));
import * as api from "../actions-api";
import { executeAction, isInteractiveAction } from "../actions";

const mocked = vi.mocked(api);

beforeEach(() => vi.resetAllMocks());

describe("executeAction", () => {
  it("shows the payments it found as a card", async () => {
    const payments = [{ paymentId: "p1", kind: "TOP_UP", status: "PENDING", amount: { amountMinor: 500, currency: "GBP" }, credits: 50, caseId: "c1", caseTitle: "Dispute", createdAt: "2026-11-01T00:00:00Z", failureReason: null }] as never;
    mocked.checkPayment.mockResolvedValue({ payments });
    const result = await executeAction("CHECK_PAYMENT");
    expect(result).toMatchObject({ ok: true, card: { kind: "PAYMENTS" } });
  });

  it("says so, with no card, when there is nothing to show", async () => {
    mocked.showCredits.mockResolvedValue({ cases: [] });
    mocked.showLawyerRequests.mockResolvedValue({ requests: [] });
    expect(await executeAction("SHOW_CREDITS")).toEqual({ ok: true, text: "You don't have any cases with Chat Credits yet." });
    expect((await executeAction("SHOW_LAWYER_REQUESTS")).card).toBeUndefined();
  });

  it("carries on down the flow's success path after a password reset email", async () => {
    mocked.sendPasswordReset.mockResolvedValue({ sent: true });
    expect(await executeAction("SEND_PASSWORD_RESET")).toEqual({ ok: true });
  });

  it("explains a Google account has no password to reset", async () => {
    mocked.sendPasswordReset.mockResolvedValue({ sent: false, reason: "GOOGLE_ACCOUNT" });
    const result = await executeAction("SEND_PASSWORD_RESET");
    expect(result.ok).toBe(true);
    expect(result.text).toMatch(/Google/);
  });

  it("fails quietly, so the flow's own failure step does the explaining", async () => {
    mocked.checkPayment.mockRejectedValue(new Error("Stripe is down"));
    expect(await executeAction("CHECK_PAYMENT")).toEqual({ ok: false });
  });

  it("can't do what isn't built into the chat", async () => {
    const result = await executeAction("OPEN_TICKET");
    expect(result.ok).toBe(false);
  });

  it("leaves exporting and deleting to their own steps", () => {
    expect(isInteractiveAction("EXPORT_MY_DATA")).toBe(true);
    expect(isInteractiveAction("DELETE_MY_ACCOUNT")).toBe(true);
    expect(isInteractiveAction("CHECK_PAYMENT")).toBe(false);
  });
});
