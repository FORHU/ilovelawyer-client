import type { Case } from "./types";

/**
 * PLACEHOLDER for the real AI service (handoff: "replace with the real AI service,
 * scoped to the case's details and documents"). Keyword-matched canned text, as in the prototype.
 */
export function mockAiReply(c: Case, text: string): string {
  const t = text.toLowerCase();
  if (/right|entitle/.test(t))
    return `Based on what you've shared in "${c.title}", you generally have the right to written notice, a chance to respond, and fair treatment. If those were skipped, you may be entitled to reinstatement or separation pay, plus back wages.`;
  if (/first|do now|next|start/.test(t))
    return "Start by keeping evidence: screenshot messages with dates visible, save your contract and payslips, and write down a timeline of events while it's fresh. Don't sign anything you don't fully understand.";
  if (/document|file|evidence/.test(t))
    return "The most useful documents are your contract, payslips, any written notices or messages, and anything showing how your role or the other party's conduct changed. Add them under the Documents tab and I'll use them.";
  if (/summar/.test(t)) {
    const side =
      c.side === "CLAIMANT"
        ? "one bringing the complaint"
        : c.side === "RESPONDENT"
          ? "one responding"
          : "party (side not set)";
    return `Here's where "${c.title}" stands: a ${c.area.toLowerCase()} matter${c.where ? " in " + c.where : ""}, you are the ${side}, with ${c.files.length} document(s) attached. The next step is to list key dates and gather any missing paperwork.`;
  }
  return "Thanks. In general, the strength of your position depends on the facts and the paperwork you hold. Keep records of everything, and tell me more about the key dates so I can be specific.";
}
