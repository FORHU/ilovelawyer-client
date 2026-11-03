/** Syncs a voice reply's transcript to its audio playback — a single-turn trim of
 * ilovelawyer-app's Audio Overview sync logic (apps/web/components/audio-overview/
 * audio-overview-sync.ts), which is built for a multi-turn host script. A chat reply is always
 * one assistant turn starting at time 0, so the turn-indexing layer there (activeTurnIndex,
 * turnEnd, hostBands) doesn't apply here — only the within-one-turn word/sentence highlighting
 * (turnSegments, wordStates) does, ported with that simplification. */

export interface MarkTiming {
  time: number;
  start: number;
  end: number;
}

/** "m:ss" for the player's clock. */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type WordState = "spoken" | "speaking" | "upcoming";

/** Splits `text` into words with a playback state each, by character share across [0, duration] —
 * the fallback when no word-level marks are available for a stretch of text. */
function wordStates(text: string, start: number, end: number, time: number): { word: string; state: WordState }[] {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + w.length + 1, 0) || 1;
  const fraction = end > start ? (time - start) / (end - start) : 0;
  let consumed = 0;
  return words.map((word) => {
    const from = consumed / total;
    consumed += word.length + 1;
    const to = consumed / total;
    const state: WordState = fraction >= to ? "spoken" : fraction >= from ? "speaking" : "upcoming";
    return { word, state };
  });
}

export interface TextSegment {
  text: string;
  state: WordState;
}

function lastStartedMark(time: number, marks: MarkTiming[]): number {
  let active = -1;
  for (let i = 0; i < marks.length; i++) {
    if (marks[i]!.time <= time) active = i;
    else break;
  }
  return active;
}

/** Splits the reply's full text into playback-state segments, using the best timing data
 * available: word marks (exact) > sentence marks (exact spans, words within estimated by
 * character share) > neither (the whole text estimated across [0, duration]). Every character of
 * `text` lands in exactly one segment. */
export function textSegments(text: string, duration: number, time: number, words?: MarkTiming[] | null, sentences?: MarkTiming[] | null): TextSegment[] {
  if (words?.length) {
    const active = lastStartedMark(time, words);
    const segments: TextSegment[] = [];
    let cursor = 0;
    const gap = (i: number): WordState => (active >= Math.max(i - 1, 0) ? "spoken" : "upcoming");
    words.forEach((word, i) => {
      const state: WordState = i < active ? "spoken" : i === active ? "speaking" : "upcoming";
      const from = Math.max(word.start, cursor);
      if (from > cursor) segments.push({ text: text.slice(cursor, from), state: gap(i) });
      if (word.end > from) segments.push({ text: text.slice(from, word.end), state });
      cursor = Math.max(cursor, word.end);
    });
    if (cursor < text.length) segments.push({ text: text.slice(cursor), state: gap(words.length) });
    return segments;
  }

  if (sentences?.length) {
    const segments: TextSegment[] = [];
    let cursor = 0;
    sentences.forEach((sentence, i) => {
      const from = Math.max(sentence.start, cursor);
      if (from > cursor) segments.push({ text: text.slice(cursor, from), state: time >= sentence.time ? "spoken" : "upcoming" });
      const sentenceEnd = sentences[i + 1]?.time ?? duration;
      for (const { word, state } of wordStates(text.slice(from, sentence.end), sentence.time, sentenceEnd, time)) {
        segments.push({ text: `${word} `, state });
      }
      cursor = Math.max(cursor, sentence.end);
    });
    if (cursor < text.length) segments.push({ text: text.slice(cursor), state: time >= duration ? "spoken" : "upcoming" });
    return segments;
  }

  return wordStates(text, 0, duration, time).map(({ word, state }) => ({ text: `${word} `, state }));
}
