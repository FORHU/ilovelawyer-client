import type { SupportOutcomeEvent } from "./types";

/** The most the API takes in one request. */
const API_BATCH_MAX = 20;
export const FLUSH_AT = 10;
export const FLUSH_EVERY_MS = 15_000;

export interface OutcomeReporter {
  push: (event: SupportOutcomeEvent) => void;
  /** Sends what is waiting. Call it when the chat closes. */
  flush: () => void;
}

/** Collects what a conversation reports and sends it in batches: at ten events, every fifteen
 * seconds, and when asked (the chat closing). Best effort: a batch that fails to send is dropped,
 * because the chat must never wait on, or nag about, its own statistics. */
export function createOutcomeReporter(send: (events: SupportOutcomeEvent[]) => Promise<unknown>): OutcomeReporter {
  let queue: SupportOutcomeEvent[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const flush = () => {
    clear();
    while (queue.length > 0) {
      const batch = queue.slice(0, API_BATCH_MAX);
      queue = queue.slice(API_BATCH_MAX);
      void send(batch).catch(() => {});
    }
  };

  return {
    push(event) {
      queue.push(event);
      if (queue.length >= FLUSH_AT) return flush();
      if (!timer) timer = setTimeout(flush, FLUSH_EVERY_MS);
    },
    flush,
  };
}
