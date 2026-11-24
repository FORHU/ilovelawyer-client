/** Splits an assistant reply into plain-text runs and markdown-style citation links —
 * `[label](url)`, e.g. an Employment Rights Act section or a case judgment, off its real
 * legislation.gov.uk / caselaw.nationalarchives.gov.uk URL. Pure so it's testable without
 * rendering; CitationText (components/case/citation-text.tsx) turns this into pill-styled `<a>`s. */
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export type CitationSegment = { kind: "text"; text: string } | { kind: "link"; label: string; href: string };

export function citationSegments(text: string): CitationSegment[] {
  const segments: CitationSegment[] = [];
  let last = 0;
  LINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_RE.exec(text))) {
    if (match.index > last) segments.push({ kind: "text", text: text.slice(last, match.index) });
    const [, label, href] = match;
    segments.push({ kind: "link", label, href });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}
