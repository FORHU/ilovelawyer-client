/** Where a segmented control (language, light / dark) sits, and the colours that go with it:
 * - app: the app's header and the sign-in pages, on the app's tokens.
 * - overlay: the landing header, which is white over the hero photo and the page's colours once it
 *   turns solid (its --hc / --hbf tokens, landing.css).
 * - band: inside the landing's phone menu, on the landing's band tokens. */
export type SegmentedTone = "app" | "overlay" | "band";

export const SEGMENTED_TONES: Record<SegmentedTone, { group: string; on: string; off: string }> = {
  app: {
    group: "border border-line bg-subtle",
    // In dark mode the surface is barely lighter than the pill, so the chosen one takes the chip colour.
    on: "bg-surface text-ink shadow-frame dark:bg-chip",
    off: "text-ink-2 hover:text-ink",
  },
  overlay: {
    group: "border border-(--hbd)",
    on: "bg-(--hb) text-(--hbf)",
    off: "text-(--hc) opacity-80 hover:opacity-100",
  },
  band: {
    group: "border border-(--band-ink)/14",
    on: "bg-(--band-ink) text-(--band)",
    off: "text-(--band-ink)/70 hover:text-(--band-ink)",
  },
};
