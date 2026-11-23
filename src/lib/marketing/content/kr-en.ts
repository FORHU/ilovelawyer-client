// The Korean site's landing page in English (kr.ilovelawyer.com), for visitors who switch the site
// to English. It says what kr.ts says: same sections, same legal limits, same facts. DRAFT: a Korean
// lawyer must review it before launch, and it must change whenever kr.ts does. A test fails if it
// comes apart from the Korean page's shape or brings back quote and matching language.
//
// The wording keeps the 20 Nov review's limits (#160): no "quote" or matching language, no promise
// the product can't back up, the generative-AI notice, and the operator named in the footer. The
// revenue card (trust.cards[2]) and the lawyer-fee card (fees.cards[1]) are only true once the
// platform fee and intro fee are off for Korea (KAN-31, KAN-32).

import { OPERATOR_NOTE, SUPPORT_EMAIL } from "../copy";
import { KR_PROBLEMS_EN } from "./kr-problems-en";
import { KR_START_PROBLEM } from "./kr-problems";
import type { LandingContent } from "./types";

const TITLE = "ilovelawyer: Start with the facts";
const DESCRIPTION =
  "Describe what happened in your own words and our AI tools help you prepare a summary you can edit. You decide whether to seek advice from an independent lawyer. Creating a case is free, and every cost is shown before you pay. AI guidance is not legal advice.";
const DISCLAIMER =
  "This service uses generative AI. Its answers are for information only, may contain errors and are not legal advice. Don't rely on them for court dates or deadlines.";

export const KR_EN_CONTENT: LandingContent = {
  htmlLang: "en",
  meta: { title: TITLE, description: DESCRIPTION, ogLocale: "en_US", siteName: "ilovelawyer" },
  nav: { how: "How it works", faq: "FAQ", signIn: "Sign in", start: "Start a case", menu: "Menu" },
  hero: {
    sectionLabel: "Start with the facts",
    groupLabel: "Choose a legal problem",
    defaultHeadline: ["Start with", "the facts."],
    defaultHeadlineLabel: "Start with the facts.",
    searchLabel: "Describe your legal problem",
    searchFocusPlaceholder: "Describe your legal problem",
    submitLabel: "Start a case with this",
    noMatch: "Not sure? Start a case and describe it yourself",
    tagline:
      "Describe what happened in your own words. Our AI tools help you prepare a summary you can edit, and you decide whether to seek advice from an independent lawyer.",
    cta: "Start a case",
    disclaimer: DISCLAIMER,
    play: "Play motion",
    pause: "Pause motion",
  },
  problems: KR_PROBLEMS_EN,
  startProblem: KR_START_PROBLEM,
  how: {
    sectionLabel: "Don't guess alone",
    intro: {
      left: "Don't guess",
      right: "alone.",
      sub: "Tell us what's happening, in your own words. We help you organise the facts into a clear summary, and you decide whether to seek advice from an independent lawyer.",
    },
    cta: "Start a case",
    headings: [
      "Start on your phone, continue on your computer.",
      "Your case is organised, and the lawyer is ready.",
      "Prepare a summary, then decide whether to contact a lawyer.",
      "Review information about participating independent lawyers and decide whether to get in touch.",
      "Talk with your lawyer in one place.",
      "Upload documents to draft a timeline and a document list. Check every extracted date and name yourself.",
      "Once your case is organised, the lawyer you chose takes it from there.",
    ],
    captions: [
      { label: "01 / 04 · Client summary", text: "The facts, dates, the stage of any investigation or lawsuit and the settlement status arrive already organised." },
      { label: "02 / 04 · Evidence list", text: "Content-certified letters, lease agreements, KakaoTalk chats and bank transfer records are sorted by type." },
      { label: "03 / 04 · Timeline", text: "Dates taken from your documents may appear on the timeline. It doesn't calculate or confirm legal deadlines." },
      { label: "04 / 04 · Case status", text: "A lawyer you have authorised can review your organised facts and documents." },
    ],
    clientLabel: "Client",
    solicitorLabel: "Lawyer",
    clientPhotos: [
      { src: "/landing/kr/people/pair-c0.webp", alt: "A client on a sofa reading a case summary on a tablet" },
      { src: "/landing/kr/people/pair-c1.webp", alt: "A client on a bus checking a lawyer's reply on their phone" },
      { src: "/landing/kr/people/pair-c2.webp", alt: "A client typing a message at the kitchen table" },
      { src: "/landing/kr/people/pair-c3.webp", alt: "A client at the kitchen table holding documents and a phone" },
    ],
    solicitorPhotos: [
      { src: "/landing/kr/people/pair-l0.webp", alt: "A lawyer at a desk with four monitors, thinking about a case" },
      { src: "/landing/kr/people/pair-l1.webp", alt: "A lawyer smiling at a desk with four monitors" },
      { src: "/landing/kr/people/pair-l2.webp", alt: "A lawyer writing a reply at a desk with four monitors" },
      { src: "/landing/kr/people/pair-l3.webp", alt: "A lawyer reading a client's documents at a desk with four monitors" },
    ],
  },
  paper: {
    senders: ["○○ Real Estate", "○○ District Court", "○○ Police Station, Investigation Division", "HR Team", "○○ Capital, Collections", "○○ Construction"],
    formCodes: ["Form No. 1", "Form No. 3", "Form No. 7", "Form No. 12", "Form No. 24", "Form No. 31"],
    fill: [
      "We are writing to inform you of the following about the matter above, which concerns you. Please read this document carefully and keep it. The details below describe what has happened so far, what we are asking of you and the deadline for a reply. If we receive no reply by the deadline, we may proceed with legal action without further notice.",
      "This notice is sent in connection with the contract between the parties. The amounts and dates stated are taken from our records as of the date of writing. If you dispute anything here, please tell us in writing and attach the relevant documents. Please include the document number at the top in all correspondence.",
    ],
    re: "Subject: ",
    ref: (n) => `Document no. ${n}`,
    date: (day) => `October ${day + 1}, 2026`,
    address: "14 ○○-ro, Mapo-gu, Seoul, Unit 202",
    signOff: "Sender (seal)",
    envelopeTag: "Content-certified mail",
    formName: (code) => code,
    section1: "1. Personal details",
    section2: "2. What happened",
    nextSteps: "Next steps",
    howWeHelp: "How we help",
  },
  mock: {
    lawyers: [
      {
        name: "Attorney Kim Seo-yeon",
        first: "Attorney Kim",
        initials: "K",
        firm: "Seoyeon Law Office",
        bio: "Mostly handles lease and real estate cases.",
        message: "I've read the summary. I'll review your documents and explain your options, and I can draft a reply letter for you if needed.",
      },
    ],
    starters: ["I was fired from my company", "My landlord won't return my deposit", "I received a police summons"],
    disclosure:
      "The lawyer's fee is agreed and paid directly between the client and the lawyer. ilovelawyer takes no fee for introducing or hiring a lawyer.",
    aiNote: "I gather and organise information for your lawyer. I can't give legal advice.",
    city: "Seoul",
    clientName: "Kim Ji-min",
    clientFirst: "Ji-min",
    credits: "46 credits",
    topUp: "Top up",
    getLawyer: "Find a lawyer",
    tabs: { interview: "Interview", overview: "Overview", documents: "Documents", lawyer: "Lawyer" },
    composerPlaceholder: "Tell me what happened…",
    cases: "Cases",
    guide: "Guide",
    newCaseTitle: "What's going on?",
    newCaseBody: "Tell us in writing or by voice. After a few questions, we'll organise your case. AI guidance is not legal advice.",
    newCaseBodyPhone: "Tell us in writing or by voice. After a few questions, we'll organise your case.",
    fillForm: "Prefer a form? Fill in a form instead",
    fillFormPhone: "Prefer a form? Fill in a form instead",
    shortDisclaimer: "AI guidance is not legal advice.",
    overview: {
      readyEyebrow: "Ready for lawyer review",
      readyTitle: "3 of the 3 things a lawyer needs",
      criteria: ["What happened", "Key documents", "The help you want"],
      upToDate: "Up to date · updated 3 hours ago",
      continueInterview: "Continue the interview",
      summary: "Summary",
      aiWritten: "Written by AI · check that it matches what you said",
      summaryText: (msg) => `What you told us: “${msg}”. You've added a related document and want to know what it means and what to do next.`,
      timeline: "Timeline",
      timelineDate: "Oct 2, 2026",
      timelineEvent: "Received a document about this matter.",
      timelineSource: "Source: document.pdf, p. 1",
      stillNeeded: "Still needed",
      stillQuestion: "When did it start?",
      stillWhy: "It helps the lawyer check deadlines.",
      stillAnswer: "Answer in the interview →",
    },
    request: {
      eyebrow: "Request progress",
      title: "Lawyer request",
      sent: { label: "Request sent", sub: "Anonymised summary sent to the lawyer you chose" },
      finding: { label: "Conflict check", sub: "Checking the names in your case" },
      reviewingSub: "Reading the summary and writing a reply",
      quoteSub: "If you accept, you start chatting with the lawyer right away",
      working: { label: "Working with your lawyer", sub: "Messages, read-only access to your case" },
    },
    quotes: {
      verified: "KBA registration checked",
      status: "Reply received",
      reviewing: "Lawyer reviewing",
      compare: "View reply",
      heading: "Reply from the lawyer you chose",
      deadline: "Accept or decline by 9:00 am on Friday, November 20. If you don't respond, the request ends and you can send it again.",
      quoteEyebrow: "Lawyer's reply",
      directFee: "Fee agreed directly with the lawyer",
      accept: () => "Accept and start chatting",
      decline: "Decline",
    },
    messages: {
      workingWith: (first) => `Working with ${first}`,
      reviewingOne: "Lawyer reviewing",
      reviewQuote: "View reply",
      workingBanner: (name) => `You're working with ${name}`,
      heading: (name) => `Messages with ${name}`,
      intro: "They can already see your case and documents. Ask anything here.",
      you: "Me",
      author: (name) => `${name} · Your lawyer`,
      firstTime: "Nov 4, 09:12",
      secondTime: "Nov 4, 09:30",
      first: "Hi Ji-min, I've read your case. Could you share the documents you received? I'll review them before we talk.",
      reply: (first) => `Thank you, ${first}. I'm uploading the documents.`,
      file: "document.pdf",
      sharedBy: "Shared by Kim Ji-min · Nov 4, 2026",
      last: "Received. I'll get back to you this week.",
    },
    letter: {
      userBubble: "I received this document and I don't understand what it means.",
      file: "document.pdf",
      aiReply: (label) =>
        `I've read the document you added. It's an official document about ${label} and asks for a reply by November 20. I've added that date to your overview so your lawyer can see it too.`,
      offerTitle: "Want a lawyer to review this case?",
      offerBody: "A lawyer whose registration has been checked reviews your case and chat. This is included with your case.",
    },
    interview: {
      soundsLike: (label, help) => `This looks like a ${label} issue. ${help}`,
      thanks: "Thank you for telling me.",
    },
    frame: {
      laptopLabel: "The ilovelawyer app on a laptop, sample case.",
      urlHost: "kr.ilovelawyer.com",
      sampleCase: "Sample case",
      paths: ["cases/new", "cases", "cases", "cases", "cases", "cases"],
      labels: [
        "New case chat asking what happened",
        "Case overview: what the lawyer needs, an AI summary and a timeline with sources",
        "Reply from the lawyer you chose: fee agreed directly with the lawyer",
        "Screen for reviewing the lawyer's reply, with accept and decline choices",
        "Messages with the lawyer you chose, shared documents",
        "Case interview where the AI reads a document",
      ],
    },
    quietChat: {
      msg: "My lease ended and my landlord won't return my deposit",
      label: "Jeonse deposit return",
      area: "Housing",
      help: "We explain what a tenancy registration order, a payment order and a deposit-return lawsuit each involve, and the usual time limits.",
      question: "When did it start? Have you received a police summons, a prosecutor's notice or a court payment order?",
    },
    phoneLabels: {
      sent: (msg) => `The ilovelawyer app on a phone: case interview, replying to "${msg}"`,
      empty: "The ilovelawyer app on a phone: new case chat asking what happened",
    },
  },
  trust: {
    eyebrow: "Trust",
    title: "Before you start",
    cards: [
      {
        title: "KBA registration check",
        body: "Before a lawyer's profile is shown, we check their Korean Bar Association registration against official records. You can also look it up yourself on the KBA website. A registration check is not a recommendation or a guarantee of the lawyer's services.",
      },
      {
        title: "What lawyers can see",
        body: "Before sharing, we show you which lawyer receives which information and why, and you confirm it before anything is sent. Documents and AI chats open only to the lawyer you chose, after they accept your request.",
      },
      {
        title: "How ilovelawyer earns money",
        body: "ilovelawyer earns from the chat credits clients buy and the work-software subscriptions lawyers use. We take no fee for introducing or hiring a lawyer, and the lawyer's fee is agreed and paid directly between you and the lawyer.",
      },
      {
        title: "AI and personal data",
        body: "AI is used to make your case summary. We process your personal information for the purposes and periods set out in our Privacy Policy, and we don't sell it. Except where the law requires us to keep it, you can ask to access, correct or delete it.",
      },
    ],
  },
  fees: {
    eyebrow: "Costs",
    title: "See every cost before you accept",
    lede: "Everything you pay through ilovelawyer is shown before you pay, and nothing is charged until you agree.",
    cards: [
      {
        title: "Creating a case is free",
        body: "Creating a case summary is free. Extra AI credits show their price, units, expiry and refund rights before you buy.",
      },
      {
        title: "The lawyer's fee",
        body: "You choose the lawyer, and agree and pay their fee directly with them. ilovelawyer takes no fee from the lawyer's fee.",
      },
      {
        title: "Payments and refunds",
        body: "You can cancel unused AI credits within 7 days of buying them. Credits already used and exceptions set by law may be excluded, and the exact terms are shown before you pay.",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        q: "What does the AI do?",
        a: "It helps you describe your situation in your own words and produces a summary of the key dates, the stage of any investigation or lawsuit, the settlement status and the questions a lawyer may ask. It also helps you prepare for a first consultation.",
      },
      {
        q: "What can't the AI do?",
        a: "It can't give legal advice, judge your chances of winning or act for you, and it doesn't replace a lawyer. It can make mistakes, so check anything important with the lawyer you choose.",
      },
      {
        q: "Is this legal advice?",
        a: "No. ilovelawyer is not a law firm, and the AI gives only general legal information. Legal advice comes from the lawyer you choose, who is responsible for it.",
      },
      {
        q: "Do you really check lawyers' registration?",
        a: "Yes. Before a lawyer's profile is shown, our team checks their Korean Bar Association registration against official records. A registration check is not a recommendation or a guarantee of the lawyer's services.",
      },
      {
        q: "I received a police summons. Can I get help quickly?",
        a: "If you enter the date you were told to attend, it appears at the top of your case summary so a lawyer can see it right away. You can get help from defence counsel from the police-interview stage.",
      },
      {
        q: "Why do you ask about the settlement status?",
        a: "In criminal cases, a settlement with the victim greatly affects the decision to prosecute and the sentence. In civil cases, it affects whether there is a lawsuit and what it costs. We record the settlement status and any deadlines in your summary and timeline.",
      },
      {
        q: "Will a lawyer see my name?",
        a: "Before sending a request, we show you which lawyer receives which information and why, and ask for your consent. Your case, documents and AI chats open only to the lawyer you chose, after they accept your request. The lawyer may keep a copy under their duty to keep records.",
      },
      {
        q: "How much does it cost?",
        a: "Creating a case is free, and a new case includes chat credits. If you need more credits, you can buy them at the price shown before you pay. Requesting a lawyer is also free. You agree the lawyer's fee directly with the lawyer you chose.",
      },
      {
        q: "How does ilovelawyer make money?",
        a: "In two ways: the chat credits clients buy, and the work-software subscriptions lawyers pay for. We take nothing for introducing or hiring a lawyer. See “How ilovelawyer earns money” above.",
      },
      {
        q: "Can I get a refund?",
        a: "Yes. Unused credits can be cancelled and refunded within 7 days of buying them, under the law and our Refunds Policy. Credits already used and exceptions set by law may be excluded, and the exact terms are shown before you pay.",
      },
      {
        q: "What kinds of cases do you cover?",
        a: "Jeonse deposits and jeonse fraud, online defamation and insult, police investigations, unpaid wages, severance pay, unfair dismissal and workplace harassment, voice phishing, drink-driving and traffic accidents, divorce and child support, and unpaid invoices and payment orders.",
      },
      {
        q: "Is my information safe?",
        a: "We process it in line with the Personal Information Protection Act. See our Privacy Policy for details.",
      },
    ],
  },
  closing: {
    imageLabel: "A woman looking at her phone, relieved",
    imageSrc: "/landing/kr/cta.webp",
    imageFace: { fx: 0.69, fy: 0.27, width: 2000, height: 1116 },
    title: "Start when you're ready.",
    body: "Depending on your case, getting started may take around 10 minutes. You can save and come back later.",
    cta: "Start a case",
  },
  footer: {
    disclaimer: DISCLAIMER,
    product: "Product",
    legal: "Legal",
    contact: "Contact",
    terms: "Terms",
    privacy: "Privacy Policy",
    refunds: "Refunds Policy",
    supportEmail: SUPPORT_EMAIL,
    legalNote: `${OPERATOR_NOTE} ilovelawyer is not a law firm and does not give legal advice. The lawyers on the platform are independent lawyers registered with the Korean Bar Association.`,
  },
};
