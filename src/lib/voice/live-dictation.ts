/**
 * Live voice input on the app's socket (ilovelawyer-api sockets/client-dictation.socket.ts): the
 * microphone's audio streams to the API while the person talks, and the words come back as they are
 * recognised. What the socket sends and receives, and what the person is told, live here; the
 * recording itself is use-live-dictation.ts.
 */

import { msg } from "@/lib/i18n/msg";

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

/** How long before the API's per-stream limit a chained recording moves to its next stream, so the
 * API never cuts the first one off mid-word. */
export const HANDOFF_EARLY_SECONDS = 5;

/** What a recording does as another second passes. `chainUpTo` set: it carries on past the API's
 * per-stream limit (`maxSeconds`) on a new stream, up to that many seconds in all; unset, it stops
 * at the limit, as a composer's recording always has. */
export function tickAction({
  seconds,
  streamSeconds,
  maxSeconds,
  chainUpTo,
  handingOff,
}: {
  /** In all, as the person sees it. */
  seconds: number;
  /** On the stream that's open now. */
  streamSeconds: number;
  maxSeconds: number;
  chainUpTo?: number;
  /** Already between streams. */
  handingOff: boolean;
}): "continue" | "handoff" | "stop" | "limit" {
  if (!chainUpTo) return streamSeconds >= maxSeconds ? "stop" : "continue";
  if (seconds >= chainUpTo) return "limit";
  if (!handingOff && streamSeconds >= Math.max(1, maxSeconds - HANDOFF_EARLY_SECONDS)) return "handoff";
  return "continue";
}

export const MIC_OFF = msg("Microphone is off. You can type instead, or allow it in your browser settings.");
export const UNSUPPORTED = msg("Voice input isn't available in this browser. You can type instead.");
export const NOTHING_HEARD = msg("We didn't catch anything. Try again, or type instead.");
export const FAILED = msg("We couldn't turn that into text. You can type instead.");
export const OFFLINE = msg("Voice input needs a connection. Try again in a moment, or type instead.");
export const CONNECTION_LOST = msg("The connection dropped, so we stopped listening. What we heard is in the box.");
export const LONG_ENOUGH = msg("That's as long as one recording can be, so we stopped listening. What we heard is in the box. You can type the rest, or keep talking.");

/** What a refused start tells the person. The API's own message says why (consent off, AI not open
 * on this site, too many tries), so it is shown as it is; only a missing one falls back. */
export function refusalMessage(ack: unknown): string {
  const message = (ack as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : FAILED;
}

/** How loud a stretch of the microphone's samples is, 0 (silence) to 1 (loud speech), for the
 * waveform. On a decibel scale, so quiet speech still moves the bars: -50 dB and under is 0,
 * -10 dB and over is 1. */
export function levelOf(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / samples.length);
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db + 50) / 40));
}
