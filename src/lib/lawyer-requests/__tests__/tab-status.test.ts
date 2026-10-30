import { describe, it, expect } from "vitest";
import { CLIENT_REQUEST_STATUSES } from "@/lib/client-handoff";
import { lawyerTabStatus } from "../tab-status";

describe("lawyerTabStatus", () => {
  it("has a pill for every status", () => {
    for (const s of CLIENT_REQUEST_STATUSES) expect(lawyerTabStatus(s).text).not.toBe("");
  });

  it("flags a quote to review and an unfound lawyer as alerts", () => {
    expect(lawyerTabStatus("QUOTED").tone).toBe("error");
    expect(lawyerTabStatus("EXPIRED").tone).toBe("error");
  });

  it("names the lawyer once engaged, when known", () => {
    expect(lawyerTabStatus("ENGAGED", "Priya")).toEqual({ text: "Working with Priya", tone: "success" });
    expect(lawyerTabStatus("ENGAGED").text).toBe("Working with your lawyer");
  });
});
