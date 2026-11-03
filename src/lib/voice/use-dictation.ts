"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/fetch";
import { getDictation, startDictation } from "./api";

export type DictationPhase = "idle" | "recording" | "transcribing";

/** A spoken answer, not a recording of a hearing: stops by itself after this long. */
export const MAX_DICTATION_SECONDS = 180;
const POLL_MS = 2000;
/** Transcribe takes longer on a longer clip, so the wait grows with it: a floor for a short clip,
 * then twice the length of the clip on top. */
const pollBudgetMs = (clipSeconds: number) => 120_000 + clipSeconds * 2000;

export const MIC_OFF = "Microphone is off. You can type instead, or allow it in your browser settings.";
const UNSUPPORTED = "Voice input isn't available in this browser. You can type instead.";
const NOTHING_HEARD = "We didn't catch anything. Try again, or type instead.";
const FAILED = "We couldn't turn that into text. You can type instead.";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Records from the microphone and returns the spoken words as text. The microphone is only asked
 * for when `start` is called, from a tap. `onText` gets the words once they are ready; the caller
 * puts them in the composer, where they can be edited before sending. */
export function useDictation({ onText }: { onText: (text: string) => void }) {
  const [phase, setPhase] = useState<DictationPhase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const discard = useRef(false);
  const starting = useRef(false);
  const clipSeconds = useRef(0);
  const alive = useRef(true);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  const release = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
    };
  }, [release]);

  const transcribe = useCallback(async (clip: Blob, seconds: number) => {
    setPhase("transcribing");
    try {
      const { id } = await startDictation(clip);
      const deadline = Date.now() + pollBudgetMs(seconds);
      while (Date.now() < deadline && alive.current) {
        await sleep(POLL_MS);
        if (!alive.current) return;
        const result = await getDictation(id);
        if (result.status === "FAILED") throw new Error("failed");
        if (result.status === "COMPLETED") {
          const text = result.text?.trim() ?? "";
          if (text) onTextRef.current(text);
          else setError(NOTHING_HEARD);
          return;
        }
      }
      if (alive.current) setError(FAILED);
    } catch (err) {
      if (alive.current) setError(err instanceof ApiError && err.status === 403 ? err.message : FAILED);
    } finally {
      if (alive.current) setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discard.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    // `phase` stays idle until the microphone answers, so a second tap in that gap is turned away here.
    if (phase !== "idle" || starting.current) return;
    starting.current = true;
    setError("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      starting.current = false;
      setError(UNSUPPORTED);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      starting.current = false;
      if (!alive.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      release();
      stream.current = media;
      const rec = new MediaRecorder(media);
      recorder.current = rec;
      chunks.current = [];
      discard.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        release();
        recorder.current = null;
        if (discard.current || !alive.current) {
          setPhase("idle");
          return;
        }
        void transcribe(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }), clipSeconds.current);
      };
      setSeconds(0);
      clipSeconds.current = 0;
      setPhase("recording");
      rec.start();
      timer.current = setInterval(() => {
        clipSeconds.current += 1;
        if (clipSeconds.current >= MAX_DICTATION_SECONDS) stop();
        setSeconds(clipSeconds.current);
      }, 1000);
    } catch {
      starting.current = false;
      release();
      setPhase("idle");
      setError(MIC_OFF);
    }
  }, [phase, release, stop, transcribe]);

  return { phase, seconds, error, clearError: () => setError(""), start, stop, cancel };
}
