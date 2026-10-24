import { describe, it, expect } from "vitest"
import { creditsUsedPercent, creditsStatus } from "../credit-usage"

describe("creditsUsedPercent", () => {
  it("computes 0%, 50%, 80% and 100% exactly, rounded to a whole number", () => {
    expect(creditsUsedPercent(100, 100)).toBe(0)
    expect(creditsUsedPercent(50, 100)).toBe(50)
    expect(creditsUsedPercent(20, 100)).toBe(80)
    expect(creditsUsedPercent(0, 100)).toBe(100)
  })

  it("can never read over 100% — spending more credits than you have isn't possible", () => {
    expect(creditsUsedPercent(0, 100)).toBe(100)
  })

  it("reads a recent top-up (remaining above the included baseline) as 0% used, not negative", () => {
    expect(creditsUsedPercent(150, 100)).toBe(0)
  })

  it("reads a non-positive included amount as 0%", () => {
    expect(creditsUsedPercent(5, 0)).toBe(0)
  })
})

describe("creditsStatus", () => {
  it("is normal under 80%", () => {
    expect(creditsStatus(100, 100)).toBe("normal")
    expect(creditsStatus(21, 100)).toBe("normal")
  })

  it("is warning from 80% up to (not including) 100%", () => {
    expect(creditsStatus(20, 100)).toBe("warning")
    expect(creditsStatus(1, 100)).toBe("warning")
  })

  it("is critical at 100% — exactly when the case is out of credits", () => {
    expect(creditsStatus(0, 100)).toBe("critical")
  })
})
