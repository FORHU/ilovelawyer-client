"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceRecorderState = "idle" | "requesting" | "recording";

/** Records a mic clip (MediaRecorder, webm/opus — supported by every browser this app targets;
 * there's no prior audio-recording code in this app to reuse). `onStop` receives the Blob once
 * recording ends normally; `stop` with no recording in progress is a no-op. State returns to
 * "idle" as soon as recording stops — sending the blob onward (and showing that progress) is the
 * caller's own concern, e.g. a mutation's isPending, not this hook's. */
export function useVoiceRecorder(onStop: (blob: Blob) => void) {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setState("idle");
        onStop(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch (err) {
      stopStream();
      setState("idle");
      setError(err instanceof Error ? err.message : "Couldn't access the microphone");
    }
  }, [onStop, stopStream]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  /** Discards the recording in progress without calling onStop — the mic is released but nothing
   * is sent. */
  const cancel = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.onstop = () => stopStream();
      recorderRef.current.stop();
    }
    chunksRef.current = [];
    setState("idle");
  }, [stopStream]);

  return { state, error, start, stop, cancel };
}
