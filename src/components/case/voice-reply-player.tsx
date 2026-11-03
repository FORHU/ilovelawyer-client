"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useVoiceReplyPlayer } from "@/lib/cases/use-voice-reply-player";
import { formatClock, textSegments, type MarkTiming, type WordState } from "@/lib/cases/voice-reply-sync";
import { VoiceReplyWaveform } from "./voice-reply-waveform";

const WORD_CLASS: Record<WordState, string> = {
  spoken: "text-ink",
  speaking: "text-ink shadow-[inset_0_-1.5px_0_var(--color-gold)]",
  upcoming: "text-muted",
};

/** The AI's spoken reply: a waveform + transport (play/pause, ±10s, speed) over the same shared
 * `<audio>` element, plus a scrollable transcript that highlights word-by-word as it's spoken and
 * auto-follows playback until the listener scrolls away manually. Mirrors ilovelawyer-app's Audio
 * Overview player (components/audio-overview-player.tsx + audio-overview-transcript.tsx), trimmed
 * to one turn — a chat reply has no multi-turn host script to navigate. */
export function VoiceReplyPlayer({
  audioUrl,
  text,
  sentenceTimings,
  wordTimings,
  autoPlay = false,
}: {
  audioUrl: string;
  text: string;
  sentenceTimings: MarkTiming[];
  wordTimings: MarkTiming[];
  /** Starts itself once, right after mounting — for the one reply the client is actively waiting
   * on, same idiom as the plain <audio autoPlay> this replaces: a stable React key means this
   * component (and its one-shot effect) never remounts on a later re-render, so it can't re-fire. */
  autoPlay?: boolean;
}) {
  const player = useVoiceReplyPlayer(audioUrl);
  const stageRef = useRef<HTMLDivElement>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    if (autoPlay) player.togglePlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally once, on mount only
  }, []);

  const segments = textSegments(text, player.duration, player.currentTime, wordTimings, sentenceTimings);

  useEffect(() => {
    if (!follow) return;
    const stage = stageRef.current;
    const active = stage?.querySelector<HTMLElement>('[data-state="speaking"]');
    if (stage && active) {
      stage.scrollTo({ top: Math.max(0, active.offsetTop - stage.clientHeight * 0.4), behavior: "smooth" });
    }
  }, [player.currentTime, follow]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-line bg-subtle p-2.5">
      {player.audioElement}
      <VoiceReplyWaveform url={audioUrl} mediaElement={player.mediaElement} className="h-9" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => player.skip(-10)}
          aria-label="Back 10 seconds"
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-chip"
        >
          <RotateCcw size={14} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={player.togglePlay}
          aria-label={player.isPlaying ? "Pause" : "Play"}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold text-white"
        >
          {player.isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
        </button>
        <button
          type="button"
          onClick={() => player.skip(10)}
          aria-label="Forward 10 seconds"
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-chip"
        >
          <RotateCw size={14} strokeWidth={1.6} />
        </button>
        <span className="font-mono text-[10.5px] text-ink-2">
          {formatClock(player.currentTime)} / {formatClock(player.duration)}
        </span>
        <button
          type="button"
          onClick={player.cycleRate}
          aria-label={`Playback speed ${player.playbackRate}×, change speed`}
          className="ml-auto min-w-9 rounded-full border border-line px-2 py-0.5 font-mono text-[10.5px] text-ink-2 hover:border-line-hover"
        >
          {player.playbackRate}×
        </button>
      </div>
      <div className="relative">
        <div
          ref={stageRef}
          onWheel={() => setFollow(false)}
          onTouchMove={() => setFollow(false)}
          className="max-h-28 overflow-y-auto overscroll-contain text-[13px] leading-5"
        >
          {segments.map((s, i) => (
            <span key={i} data-state={s.state} className={`transition-colors duration-200 ${WORD_CLASS[s.state]}`}>
              {s.text}
            </span>
          ))}
        </div>
        {!follow && (
          <button
            type="button"
            onClick={() => setFollow(true)}
            className="absolute right-1 bottom-1 rounded-full border border-gold bg-subtle px-2 py-0.5 text-[10px] font-semibold text-gold"
          >
            Back to current
          </button>
        )}
      </div>
    </div>
  );
}
