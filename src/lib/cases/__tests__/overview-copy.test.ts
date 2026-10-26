import { describe, it, expect } from "vitest"
import { overviewBanner, staleChangeText } from "../overview-copy"

describe("staleChangeText", () => {
  it("names a single added document in the singular", () => {
    expect(staleChangeText({ added: 1, removed: 0 })).toBe("You've added 1 document since this was written")
  })

  it("names several added documents in the plural", () => {
    expect(staleChangeText({ added: 2, removed: 0 })).toBe("You've added 2 documents since this was written")
  })

  it("names a removal on its own", () => {
    expect(staleChangeText({ added: 0, removed: 1 })).toBe("You've removed 1 document since this was written")
  })

  it("names both an addition and a removal together, pluralised by their total", () => {
    expect(staleChangeText({ added: 1, removed: 1 })).toBe("You've added 1 and removed 1 documents since this was written")
  })

  it("falls back to a generic line when the id set changed with nothing to count (defensive)", () => {
    expect(staleChangeText({ added: 0, removed: 0 })).toBe("This was written before your latest change")
  })

  it("falls back the same way when changedSince itself is null", () => {
    expect(staleChangeText(null)).toBe("This was written before your latest change")
  })
})

describe("overviewBanner", () => {
  const sections = { summary: "READY", timeline: "READY", keyDates: "EMPTY", toGather: "READY", helps: "READY", mayHurt: "READY" } as const
  const job = { startedAt: "2026-10-24T10:00:00Z", panesDone: [] }

  it("shows RUNNING whenever a job is live, over anything else", () => {
    expect(overviewBanner({ job, generatedAt: null, sections: { ...sections, helps: "FAILED" } })).toBe("RUNNING")
  })

  it("shows FAILED when the first run failed before saving anything", () => {
    expect(overviewBanner({ job: null, generatedAt: null, sections: { ...sections, helps: "FAILED" } })).toBe("FAILED")
  })

  it("leaves a later partial failure to its own section", () => {
    expect(overviewBanner({ job: null, generatedAt: "2026-10-20T10:00:00Z", sections: { ...sections, helps: "FAILED" } })).toBe(null)
  })

  it("shows STALE when any section is out of date", () => {
    expect(overviewBanner({ job: null, generatedAt: "2026-10-20T10:00:00Z", sections: { ...sections, mayHurt: "STALE" } })).toBe("STALE")
  })

  it("shows nothing for a READY overview, with or without key dates", () => {
    const outsideUk = { ...sections, keyDates: undefined }
    expect(overviewBanner({ job: null, generatedAt: "2026-10-20T10:00:00Z", sections })).toBe(null)
    expect(overviewBanner({ job: null, generatedAt: "2026-10-20T10:00:00Z", sections: outsideUk })).toBe(null)
  })
})
