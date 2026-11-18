// Everything the landing page says and shows that differs between the client app's sites: words,
// photos, the invented lawyers and their fees. One object per tenant (uk.ts, kr.ts); the components
// read it with useLandingContent() and hold no text of their own. Layout, motion and geometry stay
// shared, which is why the counts here (how headings, terminal captions, monitors) are fixed.

import type { CSSProperties } from "react";
import type { Problem } from "../problems";

export interface MockLawyer {
  name: string;
  /** What the app calls them in a sentence: "Sarah", or the whole name where there is no first one. */
  first: string;
  initials: string;
  firm: string;
  bio: string;
  /** The lawyer's own fee, the platform fee and what the client pays, already written as money. */
  fee: string;
  platform: string;
  total: string;
  message: string;
}

export interface PhotoSlot {
  src: string;
  alt: string;
  position?: string;
  style?: CSSProperties;
}

/** The words on the mini versions of the app's screens (components/landing/mini-app.tsx). */
export interface MockText {
  lawyers: MockLawyer[];
  starters: string[];
  /** The API's own wording for who pays what (CLIENT_REQUEST_REFERRAL_DISCLOSURE in ilovelawyer-api). */
  disclosure: string;
  aiNote: string;
  /** The place shown after the case's area in its header, and the client's name in the sample. */
  city: string;
  clientName: string;
  clientFirst: string;
  credits: string;
  topUp: string;
  getLawyer: string;
  tabs: { interview: string; overview: string; documents: string; lawyer: string };
  composerPlaceholder: string;
  cases: string;
  guide: string;
  newCaseTitle: string;
  newCaseBody: string;
  /** The phone's version of the new-case body, which has no AI note in it. */
  newCaseBodyPhone: string;
  fillForm: string;
  fillFormPhone: string;
  shortDisclaimer: string;
  overview: {
    readyEyebrow: string;
    readyTitle: string;
    criteria: [string, string, string];
    upToDate: string;
    continueInterview: string;
    summary: string;
    aiWritten: string;
    summaryText: (msg: string) => string;
    timeline: string;
    timelineDate: string;
    timelineEvent: string;
    timelineSource: string;
    stillNeeded: string;
    stillQuestion: string;
    stillWhy: string;
    stillAnswer: string;
  };
  request: {
    eyebrow: string;
    title: string;
    sent: { label: string; sub: string };
    finding: { label: string; sub: string };
    reviewingSub: string;
    quoteSub: string;
    working: { label: string; sub: string };
  };
  quotes: {
    verified: string;
    status: string;
    reviewing: string;
    compare: string;
    heading: string;
    deadline: string;
    quoteEyebrow: string;
    feeLine: (first: string) => string;
    platformFee: string;
    youPay: string;
    accept: (total: string) => string;
    decline: string;
  };
  messages: {
    workingWith: (first: string) => string;
    reviewingOne: string;
    reviewQuote: string;
    workingBanner: (name: string) => string;
    heading: (name: string) => string;
    intro: string;
    you: string;
    author: (name: string) => string;
    firstTime: string;
    secondTime: string;
    first: string;
    reply: (first: string) => string;
    file: string;
    sharedBy: string;
    last: string;
  };
  letter: {
    userBubble: string;
    file: string;
    /** The AI's reading of the letter, naming the case the visitor picked. */
    aiReply: (label: string) => string;
    offerTitle: string;
    offerBody: string;
  };
  interview: {
    /** What the AI says first once it has the visitor's words. */
    soundsLike: (label: string, help: string) => string;
    thanks: string;
  };
  /** The laptop's frame. */
  frame: { laptopLabel: string; urlHost: string; sampleCase: string; paths: string[]; labels: string[] };
  /** The phone's chat before a visitor has typed or picked anything. */
  quietChat: { msg: string; label: string; area: string; help: string; question: string };
  /** The phone's aria labels. */
  phoneLabels: { sent: (msg: string) => string; empty: string };
}

/** The strings on the drifting paper documents. */
export interface PaperText {
  senders: string[];
  formCodes: string[];
  fill: [string, string];
  re: string;
  ref: (n: number) => string;
  date: (day: number) => string;
  address: string;
  signOff: string;
  envelopeTag: string;
  formName: (code: string) => string;
  section1: string;
  section2: string;
  nextSteps: string;
  howWeHelp: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface TrustCard {
  title: string;
  body: string;
}

export interface LandingContent {
  /** The <html lang>. */
  htmlLang: string;
  meta: { title: string; description: string; ogLocale: string; siteName: string };
  nav: { how: string; faq: string; signIn: string; start: string; menu: string };
  hero: {
    sectionLabel: string;
    groupLabel: string;
    defaultHeadline: [string, string];
    defaultHeadlineLabel: string;
    searchLabel: string;
    searchFocusPlaceholder: string;
    submitLabel: string;
    noMatch: string;
    tagline: string;
    cta: string;
    disclaimer: string;
    play: string;
    pause: string;
  };
  problems: Problem[];
  startProblem: number;
  how: {
    sectionLabel: string;
    intro: { left: string; right: string; sub: string };
    cta: string;
    /** The seven headings, in the order of HOW_HEADING_TIMES. */
    headings: string[];
    /** The four terminal captions: a label and its sentence. */
    captions: { label: string; text: string }[];
    clientLabel: string;
    solicitorLabel: string;
    clientPhotos: PhotoSlot[];
    solicitorPhotos: PhotoSlot[];
  };
  paper: PaperText;
  mock: MockText;
  trust: { eyebrow: string; title: string; cards: TrustCard[] };
  /** A section of its own between Trust and the questions, where a site wants one. */
  fees?: { eyebrow: string; title: string; lede: string; cards: { title: string; body: string }[] };
  faq: { title: string; items: FaqItem[] };
  closing: {
    imageLabel: string;
    imageSrc: string;
    /** Where the person's eyes are in the closing photo, and its size. */
    imageFace: { fx: number; fy: number; width: number; height: number };
    title: string;
    body: string;
    cta: string;
  };
  footer: {
    disclaimer: string;
    product: string;
    legal: string;
    contact: string;
    terms: string;
    privacy: string;
    refunds: string;
    supportEmail: string;
    /** Who runs the site, where the law wants it on the page. Placeholders show as chips. */
    legalNote?: string;
  };
}
