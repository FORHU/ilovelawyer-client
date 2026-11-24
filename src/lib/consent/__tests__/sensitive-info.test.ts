import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/fetch";
import { isSensitiveInfoConsentError, useSensitiveInfoPrompt } from "../sensitive-info";

describe("isSensitiveInfoConsentError", () => {
  it("recognises the API's refusal for this purpose only", () => {
    expect(isSensitiveInfoConsentError(new ApiError("x", 403, "CONSENT_REQUIRED", { purpose: "SENSITIVE_INFO" }))).toBe(true);
    expect(isSensitiveInfoConsentError(new ApiError("x", 403, "CONSENT_REQUIRED", { purpose: "AI_PROCESSING" }))).toBe(false);
    expect(isSensitiveInfoConsentError(new ApiError("x", 403, "OTHER", { purpose: "SENSITIVE_INFO" }))).toBe(false);
    expect(isSensitiveInfoConsentError(new Error("x"))).toBe(false);
  });
});

describe("the consent step's prompt", () => {
  beforeEach(() => useSensitiveInfoPrompt.getState().close(false));

  it("opens on ask and resolves with the answer", async () => {
    const asked = useSensitiveInfoPrompt.getState().ask();
    expect(useSensitiveInfoPrompt.getState().settle).not.toBeNull();
    useSensitiveInfoPrompt.getState().close(true);
    await expect(asked).resolves.toBe(true);
    expect(useSensitiveInfoPrompt.getState().settle).toBeNull();
  });

  it("shares one open step between callers, so a second send doesn't stack another", async () => {
    const first = useSensitiveInfoPrompt.getState().ask();
    const second = useSensitiveInfoPrompt.getState().ask();
    expect(second).toBe(first);
    useSensitiveInfoPrompt.getState().close(false);
    await expect(first).resolves.toBe(false);
  });

  it("asks afresh once it has been closed", async () => {
    const first = useSensitiveInfoPrompt.getState().ask();
    useSensitiveInfoPrompt.getState().close(false);
    await first;
    const next = useSensitiveInfoPrompt.getState().ask();
    expect(next).not.toBe(first);
    useSensitiveInfoPrompt.getState().close(true);
    await expect(next).resolves.toBe(true);
  });
});
