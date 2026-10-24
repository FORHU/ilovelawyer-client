import type { TenantCode } from "@/lib/tenant/client-tenant";

// The client app's own Terms of Service — not the lawyer Terms ilovelawyer-app shows.
// DRAFT pending legal review. Whenever this text materially changes, bump CLIENT_TERMS_VERSION in
// ilovelawyer-api/src/constants/auth.constants.ts (and the copy below): the API records which
// version each client account agreed to at signup.
export const CLIENT_TERMS_VERSION = "client-2026-10.2";

export interface TermsSection {
  number: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  prohibited?: string[];
  quote?: string;
}

export interface ClientTerms {
  title: string;
  effectiveDate: string;
  sections: TermsSection[];
}

const EFFECTIVE = "Effective Date: October 20, 2026.";

const GOVERNING_LAW: Record<TenantCode, { label: string; paragraphs: string[] }> = {
  PH: {
    label: "Republic of the Philippines",
    paragraphs: [
      "These Terms are governed by the laws of the Republic of the Philippines. Any dispute arising from them or from your use of the Platform will be brought before the proper courts of the Philippines.",
      "We process your personal information in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules.",
    ],
  },
  UK: {
    label: "England and Wales",
    paragraphs: [
      "These Terms are governed by the laws of England and Wales. Any dispute arising from them or from your use of the Platform will be decided by the courts of England and Wales, unless the law where you live gives you the right to bring it there.",
      "We process your personal information in line with the UK GDPR and the Data Protection Act 2018. Nothing in these Terms affects your statutory rights as a consumer.",
    ],
  },
};

const BASE_SECTIONS: TermsSection[] = [
  {
    number: "Section 01",
    title: "Acceptance of Terms",
    paragraphs: [
      "These Terms apply to your use of the ilovelawyer client app (\"the Platform\"). By creating an account you confirm that you have read them and agree to be bound by them.",
      "We may update these Terms. When a change is significant we will tell you before it takes effect and ask you to agree to the new version. If you don't agree, you can close your account.",
    ],
  },
  {
    number: "Section 02",
    title: "What ilovelawyer Is",
    paragraphs: [
      "ilovelawyer helps you understand a legal problem. Its AI explains how the law may apply to the facts and documents you give it, and you can ask a verified lawyer to take a look.",
      "The AI's answers are legal information, not legal advice, and they can be wrong or incomplete. Using the Platform does not create a lawyer-client relationship. That relationship starts only when a lawyer accepts your request and agrees the terms of their help with you.",
    ],
    quote:
      "If you face a deadline, a hearing, or a risk to your safety, contact a lawyer or the proper authorities directly. Don't wait for an answer here.",
  },
  {
    number: "Section 03",
    title: "Your Account",
    paragraphs: ["You need an account to open cases. You must be at least 18 years old to create one."],
    bullets: [
      "Give accurate details and keep them up to date.",
      "Keep your password to yourself. You are responsible for what happens under your account.",
      "Tell us straight away if you think someone else has used it.",
      "One account per person. Accounts can't be shared or transferred.",
    ],
  },
  {
    number: "Section 04",
    title: "Cases, Payment and Credits",
    paragraphs: [
      "Each case has a price and includes a number of chat credits, both shown before you pay. Each question you ask the AI uses one credit. You can buy more credits for a case at any time. Prices may change, but never for a payment you have already made.",
      "Credits belong to the case they were bought for and can't be moved to another case or exchanged for cash. Attaching documents and requesting a lawyer don't use credits.",
      "Refunds follow the refund policy shown at checkout and any rights you have under consumer law.",
    ],
  },
  {
    number: "Section 05",
    title: "AI Processing",
    paragraphs: [
      "To answer you, the Platform's AI reads the questions you ask and the documents you add to a case. AI processing is on by default. By agreeing to these Terms you consent to it.",
      "You can switch AI processing off in your account settings. While it is off, the AI can't answer questions or read new documents. Switching it off doesn't delete answers you already received.",
      "Check important answers before you rely on them, and ask a lawyer when the outcome matters.",
    ],
  },
  {
    number: "Section 06",
    title: "Requesting a Lawyer",
    paragraphs: [
      "Requesting a lawyer for a case is free. Verified lawyers review requests and decide whether to accept them. We can't promise that a lawyer will accept yours, or how quickly.",
      "Lawyers on the Platform are independent professionals, not ilovelawyer employees. Their fees, if any, and the scope of their help are agreed between you and them. When a lawyer accepts, they can see the case details and documents you have shared in that case.",
    ],
  },
  {
    number: "Section 07",
    title: "Your Documents and Privacy",
    paragraphs: [
      "You keep ownership of everything you upload. You give us permission to store and process it only to run the Platform for you, including the AI processing described above.",
      "Only upload documents you have the right to share. You can delete a case and its documents at any time. Our Privacy Notice explains what we collect, how long we keep it, and your rights.",
    ],
  },
  {
    number: "Section 08",
    title: "Acceptable Use",
    paragraphs: ["You agree not to use the Platform to:"],
    prohibited: [
      "Create fake or misleading documents, or deceive a court, an authority, or another person.",
      "Harass, threaten, or expose the private information of the other party or anyone else.",
      "Copy, scrape, or reverse engineer the Platform or its AI.",
      "Break the law or help someone else do so.",
    ],
  },
  {
    number: "Section 09",
    title: "Suspension and Closing Your Account",
    paragraphs: [
      "You can close your account at any time from your account settings. We may suspend or close an account that breaks these Terms. Where we can, we will tell you why first.",
      "When an account closes, we delete its cases and documents after the grace period described in the Privacy Notice, except for records the law requires us to keep. Credits that haven't been used don't carry over.",
    ],
  },
];

/** The Terms for the client app on `tenant`'s site. Governing law follows the Tenant; with none
 * (an unmapped host), the section names the law of the site the account was opened on. */
export function getClientTerms(tenant: TenantCode | null): ClientTerms {
  const law = tenant ? GOVERNING_LAW[tenant] : null;
  return {
    title: "Terms of Service",
    effectiveDate: law ? `${EFFECTIVE} Governing law: ${law.label}.` : EFFECTIVE,
    sections: [
      ...BASE_SECTIONS,
      {
        number: "Section 10",
        title: "Governing Law",
        paragraphs: law?.paragraphs ?? [
          "These Terms are governed by the laws of the country of the ilovelawyer site where you opened your account, and disputes go before the courts of that country.",
        ],
      },
    ],
  };
}
