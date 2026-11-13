import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOutcomeReporter, FLUSH_AT, FLUSH_EVERY_MS } from "../outcomes";
import type { SupportOutcomeEvent } from "../types";

const event = (n: number): SupportOutcomeEvent => ({ kind: "FLOW_STARTED", flowId: `f${n}` });

describe("outcome reporter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends what is waiting when asked", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const reporter = createOutcomeReporter(send);
    reporter.push(event(1));
    reporter.push(event(2));
    expect(send).not.toHaveBeenCalled();
    reporter.flush();
    expect(send).toHaveBeenCalledWith([event(1), event(2)]);
  });

  it("sends at ten events", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const reporter = createOutcomeReporter(send);
    for (let i = 0; i < FLUSH_AT - 1; i++) reporter.push(event(i));
    expect(send).not.toHaveBeenCalled();
    reporter.push(event(99));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toHaveLength(FLUSH_AT);
  });

  it("sends after fifteen seconds, once", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const reporter = createOutcomeReporter(send);
    reporter.push(event(1));
    vi.advanceTimersByTime(FLUSH_EVERY_MS - 1);
    expect(send).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(send).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(FLUSH_EVERY_MS * 2);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when nothing happened", () => {
    const send = vi.fn().mockResolvedValue(undefined);
    createOutcomeReporter(send).flush();
    expect(send).not.toHaveBeenCalled();
  });

  it("drops a batch that fails rather than raising or retrying it", async () => {
    const send = vi.fn().mockRejectedValue(new Error("offline"));
    const reporter = createOutcomeReporter(send);
    reporter.push(event(1));
    reporter.flush();
    await Promise.resolve();
    reporter.flush();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
