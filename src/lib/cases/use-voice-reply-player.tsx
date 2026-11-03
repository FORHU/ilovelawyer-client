"use client";

import { useRef, useState } from "react";

const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75];

/** Wraps a voice reply's `<audio>` element — play/pause, scrub, duration, rate — the same shape
 * as ilovelawyer-app's useAudioOverviewPlayer, trimmed: no resume-position persistence (a chat
 * reply is short enough that losing the exact second on leaving the tab isn't worth a
 * localStorage key per message) and no player-bar-dismiss concept (this player lives inline in
 * the message, not a persistent bottom bar). */
export function useVoiceReplyPlayer(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [mediaElement, setMediaElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seek = (seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(seconds, duration || seconds));
  };
  const skip = (deltaSeconds: number) => seek((audioRef.current?.currentTime ?? 0) + deltaSeconds);
  const cycleRate = () => {
    const el = audioRef.current;
    const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(playbackRate) + 1) % PLAYBACK_RATES.length]!;
    setPlaybackRate(next);
    if (el) el.playbackRate = next;
  };

  const audioElement = (
    <audio
      ref={(el) => {
        audioRef.current = el;
        setMediaElement(el);
      }}
      src={audioUrl}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={() => setIsPlaying(false)}
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      className="hidden"
    />
  );

  return { audioElement, mediaElement, isPlaying, currentTime, duration, playbackRate, togglePlay, seek, skip, cycleRate };
}
