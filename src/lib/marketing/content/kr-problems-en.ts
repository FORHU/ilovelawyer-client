// The English version of the Korean site's problems (kr-problems.ts), for visitors who switch the
// Korean site to English. Same rows, so the same photos, crops and keywords (which already include
// English and Korean ones); only the words change. DRAFT: a Korean lawyer must review it.

import { buildKrProblems, KR_PROBLEM_ROWS, type KrProblemRow } from "./kr-problems";

type Words = Pick<KrProblemRow, "tag" | "label" | "h" | "ex" | "say">;

/** What the "how we help" line ends with: the client can ask a lawyer they choose to review it. */
const TAIL = " After that, you can ask a lawyer you choose to review it.";

/** Several cards quote deadlines, so each says the examples promise no remedy and no lawyer. */
const NOTE = " Examples help you describe your situation. They don't promise any particular remedy or lawyer, and court dates and deadlines must always be confirmed.";

const WORDS: Record<string, Words> = {
  "jeonse-deposit": { tag: "Housing", label: "Jeonse deposit return", h: "Can't get your jeonse deposit back?", ex: "We explain what a tenancy registration order, a payment order and a deposit-return lawsuit each involve, and the usual time limits.", say: "My lease ended and my landlord won't return my deposit" },
  "jeonse-fraud": { tag: "Housing", label: "Jeonse fraud", h: "Think you've been a victim of jeonse fraud?", ex: "We set out what you can do now: applying for victim status, the auction process and deposit-insurance claims.", say: "My landlord stopped answering and the house is going to auction" },
  "online-defamation": { tag: "Criminal", label: "Online defamation", h: "Reported over something you posted online?", ex: "We explain when even a true statement can count as defamation, and what to prepare before a police interview.", say: "I wrote a review and was reported for defamation" },
  "cyber-insult": { tag: "Criminal", label: "Insult complaint", h: "Want to report abusive comments?", ex: "We explain the difference between insult and defamation, how to keep evidence and the filing deadline (6 months).", say: "I want to report an online troll" },
  "police-summons": { tag: "Criminal", label: "Police summons", h: "Summoned by the police?", ex: "We explain what to check before you attend, your rights when giving a statement and why having defence counsel with you matters.", say: "The police told me to come in" },
  "unpaid-wages": { tag: "Labour", label: "Unpaid wages", h: "Haven't been paid on time?", ex: "We explain what a labour office complaint, a substitute payment and a civil lawsuit each involve, and the usual time limits.", say: "I haven't been paid for three months" },
  "severance-pay": { tag: "Labour", label: "Severance pay", h: "Haven't received your severance pay?", ex: "We explain who qualifies for severance pay, how it is calculated and the 14-day payment deadline after you leave.", say: "I quit and they won't pay my severance" },
  "unfair-dismissal": { tag: "Labour", label: "Unfair dismissal", h: "Suddenly dismissed?", ex: "We explain the grounds for dismissal, the written-notice requirement and the 3-month deadline to apply to the Labour Relations Commission.", say: "I was told overnight that I'm fired" },
  "workplace-bullying": { tag: "Labour", label: "Workplace harassment", h: "Being bullied at work?", ex: "We explain what counts as workplace harassment, how to report it to the company and what evidence to keep.", say: "My boss shouts at me every day" },
  "voice-phishing": { tag: "Finance", label: "Voice phishing", h: "Sent money to a voice-phishing scammer?", ex: "We outline, in the usual order, how to request a payment freeze, apply for victim relief and file a complaint.", say: "I sent money after a call claiming to be from the prosecutors' office" },
  dui: { tag: "Traffic", label: "Drunk driving", h: "Caught drink-driving?", ex: "We explain the licence revocation and suspension criteria, the 90-day deadline for an administrative appeal and the criminal process.", say: "I was stopped at a drink-driving checkpoint and may lose my licence" },
  "traffic-accident": { tag: "Traffic", label: "Traffic accident settlement", h: "Unsure about a traffic accident settlement?", ex: "We explain the difference between a criminal settlement and insurance compensation, what a settlement agreement should include and the time limits.", say: "There was an accident and I don't know how much to pay" },
  divorce: { tag: "Family", label: "Divorce and alimony", h: "Thinking about divorce?", ex: "We explain divorce by agreement and by court judgment, and the criteria for alimony and dividing property.", say: "I'm getting divorced and I'm worried about dividing our property" },
  "child-support": { tag: "Family", label: "Child support", h: "Not receiving child support?", ex: "We explain how to claim child support, how a performance order works and the help the Child Support Agency offers.", say: "My ex-spouse isn't sending child support" },
  "unpaid-invoice": { tag: "Business", label: "Subcontract / unpaid invoice", h: "Is a client refusing to pay?", ex: "We explain what a content-certified letter, a payment order and a subcontract-dispute report each involve.", say: "A client hasn't paid for construction work in six months" },
  "payment-order": { tag: "Civil", label: "Payment order received", h: "Received a payment order from a court?", ex: "A payment order becomes final unless you object within 2 weeks of service. We explain how to object.", say: "I received payment order papers from the court" },
};

export const KR_PROBLEMS_EN = buildKrProblems(
  KR_PROBLEM_ROWS.map((row) => ({ ...row, ...WORDS[row.slug] })),
  { tail: TAIL, note: NOTE, alt: (label) => `Photo of a ${label} situation` },
);
