import type { Case } from "./types";

/** Demo account case returned by "Sign in" (prototype SAMPLE). */
export const SAMPLE_CASE: Case = {
  id: 1,
  credits: 38,
  title: "Fired without notice",
  area: "Employment",
  where: "Quezon City",
  side: "CLAIMANT",
  others: [{ id: "o1", name: "ABC Logistics Corp.", role: "Opposing party" }],
  files: ["Employment contract.pdf", "Payslips Jan-Aug.pdf"],
  chat: [
    {
      role: "user",
      text: "I was fired by text message on Oct 14 with no reason given. Is that legal?",
    },
    {
      role: "ai",
      text: "Usually not. A regular employee can only be dismissed for a just or authorized cause, and the employer must follow due process.\n\nFor a just cause: a written notice of the charge, a chance to explain, then a written notice of the decision.\n\nBeing told by text, with no hearing, is usually a due-process failure. From your contract, you are a regular employee with 3 years of service, which strengthens your position.",
    },
    { role: "offer" },
  ],
};

export const SAMPLE_FILES = [
  "Employment contract.pdf",
  "Payslips Jan-Aug.pdf",
  "Text messages.png",
  "Termination notice.pdf",
];
