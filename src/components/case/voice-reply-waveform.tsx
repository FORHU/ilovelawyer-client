"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

/** Reads a design token off the element, resolved at draw time — wavesurfer paints a canvas,
 * which can't resolve `var(--x)` itself. Trimmed from ilovelawyer-app's AudioOverviewWaveform:
 * this app has no dark mode (no @media variant in globals.css), so there's no theme to redraw on. */
function token(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** A waveform rendered by wavesurfer.js, bound to the SAME `<audio>` element the rest of the
 * player controls (passed in as `mediaElement`) — clicking or dragging seeks that element
 * directly, and the player's own state picks the change up through the native events it already
 * listens to. Mirrors ilovelawyer-app's Audio Overview waveform (apps/web/components/
 * audio-overview/audio-overview-waveform.tsx) so a voice reply looks and behaves the same way. */
export function VoiceReplyWaveform({ url, mediaElement, className = "h-10" }: { url: string; mediaElement: HTMLAudioElement | null; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !mediaElement) return;
    const ws = WaveSurfer.create({
      container: el,
      media: mediaElement,
      url,
      height: "auto",
      waveColor: token(el, "--color-line", "#e8e8e8"),
      progressColor: token(el, "--color-gold", "#8a6200"),
      cursorColor: token(el, "--color-ink", "#252525"),
      cursorWidth: 2,
      normalize: false,
      dragToSeek: true,
    });
    wavesurferRef.current = ws;
    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [mediaElement, url]);

  return (
    <div className={`relative overflow-hidden rounded-md bg-chip ${className}`}>
      <div ref={containerRef} className="absolute inset-x-0 top-1 bottom-1" />
    </div>
  );
}
