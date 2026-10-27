import { describe, it, expect } from "vitest"
import { intakeBanner } from "../overview-copy"

describe("intakeBanner", () => {
  it("shows RUNNING while the job is live", () => {
    expect(intakeBanner({ status: "RUNNING" })).toBe("RUNNING")
  })

  it("shows FAILED when the last run failed", () => {
    expect(intakeBanner({ status: "FAILED" })).toBe("FAILED")
  })

  it("shows STALE once the case, chat or documents changed since it was written", () => {
    expect(intakeBanner({ status: "STALE" })).toBe("STALE")
  })

  it("shows no banner for EMPTY (no run yet) or READY (up to date)", () => {
    expect(intakeBanner({ status: "EMPTY" })).toBe(null)
    expect(intakeBanner({ status: "READY" })).toBe(null)
  })
})
