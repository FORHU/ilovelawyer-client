// The landing page's legal and trust wording. DRAFT: a UK solicitor must review all of it before
// launch (FORHU/ilovelawyer-app#798, #846). [Square brackets] are facts or decisions still to come;
// they show as dashed chips and must all be gone before the page goes public.
//
// Pricing follows the app and API, not the design's draft. Creating a case is free and credits are
// paid (lib/auth/terms.ts). Hiring a lawyer means paying their fee plus a platform fee through
// ilovelawyer, and what lawyers see follows the consent text (client-request.constants.ts in
// ilovelawyer-api). The draft described a fee to open a case and a referral fee paid by the solicitor.

export type CopyPart = { kind: "text" | "placeholder"; text: string } | { kind: "link"; text: string; href: string };

const LINKS: Record<string, string> = { "Privacy Policy": "/privacy", "Refunds Policy": "/refunds" };

/** Splits wording into plain text, [placeholders] and links to the policies it names. */
export function copyParts(text: string): CopyPart[] {
  return text
    .split(/(\[[^\]]*\]|Privacy Policy|Refunds Policy)/)
    .filter(Boolean)
    .map((t) => {
      if (t[0] === "[") return { kind: "placeholder", text: t };
      const href = LINKS[t];
      return href ? { kind: "link", text: t, href } : { kind: "text", text: t };
    });
}

export const DISCLAIMER = "AI guidance, not legal advice. Advice comes from the solicitor you choose.";

export const TRUST_CARDS = [
  {
    title: "Verified solicitors",
    body: "Every solicitor on ilovelawyer is regulated by the Solicitors Regulation Authority (SRA), the Law Society of Scotland or the Law Society of Northern Ireland. We check their registration before they can send you a quote. You can look any solicitor up on their regulator's register yourself.",
  },
  {
    title: "What solicitors can see",
    body: "Solicitors first see an anonymised summary that leaves out names and documents. Up to three can take up your request, and each also sees the names of the people and organisations in your case, only to check for a conflict of interest. Only the solicitor you hire and pay can read your case, its documents and your chat with the AI.",
  },
  {
    title: "How ilovelawyer is paid",
    body: "You can buy chat credits for your case. If you hire a solicitor, you pay through ilovelawyer: their fee, plus ilovelawyer's platform fee. Both are shown on the quote before you agree to anything. The solicitor receives their full fee, and the platform fee doesn't change what they charge you.",
  },
  {
    title: "Your data and AI",
    body: "We use AI to summarise what you tell us. Your information is used to provide the service and is not sold. You can ask to see it or delete it at any time. Read our Privacy Policy for details.",
  },
];

export const FAQS = [
  {
    q: "What can the AI do?",
    a: "It helps you explain your situation in your own words, then turns it into a clear summary: the key dates, what usually happens next, and the questions a solicitor is likely to ask. It can also help you prepare for your first conversation.",
  },
  {
    q: "What can't the AI do?",
    a: "It can't give legal advice, tell you whether you will win, represent you, or replace a solicitor. It can make mistakes, so please check anything important with the solicitor you choose.",
  },
  {
    q: "Is this legal advice?",
    a: "No. ilovelawyer is not a law firm and the AI does not give legal advice. Legal advice comes from the independent solicitor you choose to instruct, and they are responsible to you for it.",
  },
  {
    q: "Are the solicitors really verified?",
    a: "Yes. Before a solicitor can receive requests or send quotes, one of our team checks them against their regulator's register: the Solicitors Regulation Authority (SRA), the Law Society of Scotland or the Law Society of Northern Ireland. We confirm that the name matches, that they are currently practising, and which parts of the UK they are qualified in. If a solicitor changes those details, they can't take new requests until we have checked again.",
  },
  {
    q: "Do solicitors see my name?",
    a: "They first see an anonymised summary that leaves out names and documents. Solicitors who take up your request also see the names of the people and organisations in your case, only to check for a conflict of interest. The solicitor you hire and pay can read your case, its documents and your chat with the AI, and may keep a copy afterwards, as solicitors are required to keep their files.",
  },
  {
    q: "How much does it cost?",
    a: "Creating a case is free, and each new case includes a number of chat credits, shown before you create it. You can buy more credits if you need them, at the price shown before you pay. Requesting a solicitor is free too. If you hire a solicitor, you pay their fee plus ilovelawyer's platform fee, and the quote shows both before you agree to anything. Solicitors quote their fee including VAT, and nothing is added when you pay: the total on the quote is the amount you pay.",
  },
  {
    q: "How does ilovelawyer make money?",
    a: "In two ways: the chat credits you can buy for your case, and a platform fee added to a solicitor's quote when you hire them. The solicitor receives their full fee. See \"How ilovelawyer is paid\" above for details.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes, in the situations described in our Refunds Policy, including your right to cancel within 14 days. That policy also covers what you pay through ilovelawyer when you hire a solicitor.",
  },
  {
    q: "What if I don't like any of the quotes?",
    a: "You don't have to choose one, and you pay nothing for the quotes. Only a solicitor you hire and pay can read your full case.",
  },
  {
    q: "What types of case do you handle?",
    a: "Employment, property and housing, family, and consumer matters, and other everyday legal problems. We do not handle personal injury cases.",
  },
  {
    q: "Is my information safe?",
    a: "Your connection to ilovelawyer is encrypted, and so are the documents you upload when we store them. We handle your data in line with UK data protection law. See our Privacy Policy.",
  },
];

export const SUPPORT_EMAIL = "ilovelawyer.help@forhu.com";

/** A block is a paragraph, or a list of items. */
export interface LegalSection {
  title: string;
  blocks: (string | string[])[];
}

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "Who we are",
    blocks: ["[Company name], registered in [England and Wales], company number [number], registered office [address]. We are the data controller. Contact: [privacy email]. [ICO registration number: REQUIRED if applicable.]"],
  },
  {
    title: "What we collect",
    blocks: ["Account details (name, email, phone); the information you give us about your situation, including anything you upload, which may include sensitive information; payment details (handled by our payment provider, Stripe: we do not store your card number); technical data (device, IP address, cookies); and messages with your solicitor."],
  },
  {
    title: "Why we use it, and our legal basis",
    blocks: [
      [
        "To provide the service you asked for (contract).",
        "To anonymise your summary and send it to solicitors, and to show those who take up your request the names in your case for a conflict check (contract).",
        "To share your case with the solicitor you hire and pay (contract and your instruction).",
        "To prevent fraud and keep the service secure (legitimate interests).",
        "To meet legal obligations (legal obligation).",
        "Marketing, only if you opt in (consent).",
        "[Special category data: if your case involves health, ethnicity, sexuality, etc., we rely on your explicit consent. CONFIRM LEGAL BASIS WITH SOLICITOR.]",
      ],
    ],
  },
  {
    title: "AI processing",
    blocks: ["We use AI to help summarise and organise what you tell us. [Name of AI providers and where processing happens: CONFIRM.] Your content is [not used to train AI models: CONFIRM WITH PROVIDER TERMS]. AI output can be wrong, and a person decides what to do with it. No decision with legal effect is made about you by AI alone."],
  },
  {
    title: "Who we share it with",
    blocks: ["The solicitor you hire and pay (your case, its documents and your chat with the AI; they may keep a copy afterwards, as solicitors are required to keep their files), solicitors who take up your request (an anonymised summary, plus the names in your case for a conflict check), our payment provider, hosting and AI providers acting on our instructions, and authorities where the law requires. We do not sell your data."],
  },
  {
    title: "Where it is stored",
    blocks: ["[UK / EEA: CONFIRM.] If we transfer data outside the UK, we use safeguards such as the UK International Data Transfer Agreement or an adequacy decision."],
  },
  {
    title: "How long we keep it",
    blocks: ["[Case data: X years after the case closes. Account data: until you delete your account, then Y months. Payment records: 6 years for tax purposes. CONFIRM.]"],
  },
  {
    title: "Your rights",
    blocks: ["You can ask to access, correct, delete, restrict or move your data, and object to how we use it. You can withdraw consent at any time. Email [privacy email]. We aim to respond within one month."],
  },
  {
    title: "Complaints",
    blocks: ["If you are unhappy, contact us first. You can also complain to the Information Commissioner's Office: ico.org.uk, 0303 123 1113."],
  },
  { title: "Cookies", blocks: ["We use [essential cookies only / analytics with consent]. [Cookie banner and table needed: DECISION.]"] },
  { title: "Changes", blocks: ["We'll tell you about material changes by email or notice in the app."] },
];

export const REFUNDS_SECTIONS: LegalSection[] = [
  {
    title: "1. Who this covers",
    blocks: ["Creating a case is free, and so is requesting a solicitor. This policy covers what you pay through ilovelawyer: AI credit top-ups, and a solicitor's quote with ilovelawyer's platform fee."],
  },
  {
    title: "2. Your right to cancel (14 days)",
    blocks: [`If you are a consumer, you can cancel your purchase within 14 days of buying it, without giving a reason. To cancel, email ${SUPPORT_EMAIL} with your name and the email on your account.`],
  },
  {
    title: "3. If you have already started using the service",
    blocks: ["You can ask us to start the service straight away. If you then cancel within the 14 days, we may keep a fair amount for what you have already used, and we will refund the rest. [DECISION: define the amount. Typical option: refund the top-up minus the value of AI credits already used.]"],
  },
  {
    title: "4. AI credit top-ups",
    blocks: ["Unused credits can be refunded within 14 days of purchase. Credits that have been used cannot be refunded. [DECISION: whether credits expire and when.]"],
  },
  {
    title: "5. Paying a solicitor's quote",
    blocks: ["When you hire a solicitor, you pay their fee and ilovelawyer's platform fee through ilovelawyer. [DECISION: when these are refunded, including what happens to the platform fee and to work the solicitor has already done.]"],
  },
  {
    title: "6. If something went wrong",
    blocks: [`If the service was faulty, not as described, or a solicitor you hired never responded, tell us at ${SUPPORT_EMAIL} within [30] days and we will review it and, where fair, refund you.`],
  },
  { title: "7. How refunds are paid", blocks: ["Refunds go back to the original payment method within [14] days of us agreeing the refund."] },
  {
    title: "8. Complaints",
    blocks: [`If you are unhappy with how we handled your refund, contact ${SUPPORT_EMAIL}. You can also use [ADR scheme, if any]. Complaints about a solicitor's service go to the solicitor first, and then to the Legal Ombudsman.`],
  },
];

/** The Terms' sections in the legal page's shape, so /terms and the sign-up dialog can't drift apart. */
export function termsToLegalSections(sections: { title: string; paragraphs: string[]; bullets?: string[]; prohibited?: string[]; quote?: string }[]): LegalSection[] {
  return sections.map((s) => ({
    title: s.title,
    blocks: [...s.paragraphs, ...(s.bullets ? [s.bullets] : []), ...(s.prohibited ? [s.prohibited] : []), ...(s.quote ? [s.quote] : [])],
  }));
}

export const legalSectionId = (title: string, i: number) =>
  `s${i + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}`;
