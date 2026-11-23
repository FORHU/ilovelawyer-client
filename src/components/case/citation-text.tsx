import { ArrowUpRight } from "lucide-react";
import { citationSegments } from "@/lib/chat/citation-segments";

/** An assistant reply's markdown-style citation links, rendered as pill-styled external links.
 * No internal Library lookup here (unlike ilovelawyer-app's CitationLink): the client app sends
 * people to the citation's own external page, not a resolved internal document. */
const PILL_CLASS =
  "mx-0.5 inline-flex items-center gap-0.5 whitespace-normal rounded-full bg-chip px-2 py-0.5 align-[-2px] " +
  "text-[13px] font-medium text-ink hover:bg-chip/70";

/** Renders plain text as-is, and every `[label](url)` in it as a pill-styled external link.
 * Preserves the caller's `whitespace-pre-line` handling of the surrounding text — only inline
 * elements are introduced, so line breaks in the plain-text parts still render normally. */
export function CitationText({ text }: { text: string }) {
  return (
    <>
      {citationSegments(text).map((seg, i) =>
        seg.kind === "text" ? (
          seg.text
        ) : (
          <a key={i} href={seg.href} target="_blank" rel="noopener noreferrer" className={PILL_CLASS}>
            {seg.label}
            <ArrowUpRight size={11} className="shrink-0" />
          </a>
        ),
      )}
    </>
  );
}
