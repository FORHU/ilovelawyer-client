import { formatEventDate } from "@/lib/format";
import type { CaseIntake, IntakeSource } from "@/lib/types";

/** Where in the Overview a document is cited, e.g. "Key fact · “loss of trust”". */
export interface Citation {
  /** Which Overview section it sits in, for a label. */
  section: string;
  label: string;
}

const SHORT = 48;
const short = (text: string) => (text.length > SHORT ? `${text.slice(0, SHORT - 1).trimEnd()}…` : text);

/** Every Overview item that cites each document (by its intake sources), keyed by document id.
 * One item that cites the same document twice still counts once. */
export function citationsByDocument(intake: CaseIntake | undefined): Map<string, Citation[]> {
  const out = new Map<string, Citation[]>();
  if (!intake) return out;

  const add = (sources: IntakeSource[], section: string, label: string) => {
    const seen = new Set<string>();
    for (const s of sources) {
      if (s.kind !== "DOCUMENT" || !s.documentId || seen.has(s.documentId)) continue;
      seen.add(s.documentId);
      const list = out.get(s.documentId) ?? [];
      list.push({ section, label: `${section} · ${label}` });
      out.set(s.documentId, list);
    }
  };

  for (const p of intake.people) add(p.sources, "Person", p.name);
  for (const t of intake.timeline) add(t.sources, "Timeline", t.date ? formatEventDate(t.date, t.datePrecision) : short(t.text));
  for (const f of intake.facts) add(f.sources, "Key fact", `“${short(f.text)}”`);
  for (const g of intake.goals) add(g.sources, "Goal", short(g.text));
  for (const c of intake.concerns) add(c.sources, "Worry", short(c.text));
  for (const q of intake.questionsForLawyer) add(q.sources, "Question", short(q.text));
  for (const d of intake.deadlines) add(d.sources, "Date", short(d.text));
  for (const cf of intake.conflicts) add(cf.sources, "Double-check", short(cf.description));
  return out;
}
