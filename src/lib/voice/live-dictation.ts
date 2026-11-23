/**
 * Live voice input on the app's socket (ilovelawyer-api sockets/client-dictation.socket.ts): the
 * microphone's audio streams to the API while the person talks, and the words come back as they are
 * recognised. What the socket sends and receives, and what the person is told, live here; the
 * recording itself is use-live-dictation.ts.
 */

export type LiveStartAck =
  | { ok: true; languageCode: string; sampleRate: number; maxSeconds: number }
  | { ok: false; message: string; code: string };

/** What the person has said so far: the finished stretches, then the one still being revised. */
export function liveTranscript(finals: readonly string[], partial: string): string {
  return [...finals, partial]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Adds what was said to what was already typed, so a spoken sentence never replaces typed ones. */
export function appendSpoken(typed: string, spoken: string): string {
  const before = typed.trimEnd();
  const words = spoken.trim();
  if (!words) return typed;
  return before ? `${before} ${words}` : words;
}

/** "0:07", "2:59". */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export const MIC_OFF = "Microphone is off. You can type instead, or allow it in your browser settings.";
export const UNSUPPORTED = "Voice input isn't available in this browser. You can type instead.";
export const NOTHING_HEARD = "We didn't catch anything. Try again, or type instead.";
export const FAILED = "We couldn't turn that into text. You can type instead.";
export const OFFLINE = "Voice input needs a connection. Try again in a moment, or type instead.";
export const CONNECTION_LOST = "The connection dropped, so we stopped listening. What we heard is in the box.";

/** What a refused start tells the person. The API's own message says why (consent off, AI not open
 * on this site, too many tries), so it is shown as it is; only a missing one falls back. */
export function refusalMessage(ack: unknown): string {
  const message = (ack as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : FAILED;
}
