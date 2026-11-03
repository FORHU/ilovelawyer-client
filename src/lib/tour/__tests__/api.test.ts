import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/fetch", () => ({ apiFetch: vi.fn() }));
import { apiFetch } from "@/lib/api/fetch";
import { fetchSeen, TRACK } from "../api";

const fetch = vi.mocked(apiFetch);
const answer = (byTrack: Record<string, "COMPLETED" | "NOT_STARTED" | "fail">) =>
  fetch.mockImplementation(async (url: string) => {
    const track = String(url).split("/").pop()!;
    const status = byTrack[track];
    if (status === "fail") throw new Error("down");
    return { status: status ?? "NOT_STARTED" } as never;
  });

describe("fetchSeen", () => {
  beforeEach(() => fetch.mockReset());

  it("keeps the tours that answered when one track fails", async () => {
    answer({ [TRACK.T0]: "COMPLETED", [TRACK.T1]: "NOT_STARTED", [TRACK.T5]: "fail" });
    await expect(fetchSeen()).resolves.toEqual(["T0"]);
  });

  it("rejects only when no track answered", async () => {
    answer(Object.fromEntries(Object.values(TRACK).map((t) => [t, "fail" as const])));
    await expect(fetchSeen()).rejects.toThrow();
  });
});
