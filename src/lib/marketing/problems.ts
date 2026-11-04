// The legal problems the landing page's hero cycles through. Each hero photo is 3168×1344 at
// source, and fx/fy is where the person's eyes are in it (0-1), which placing the photo depends on.

export interface Problem {
  label: string;
  /** The photo at /landing/hero/<slug>.webp. */
  slug: string;
  tag: string;
  /** The headline shown while this problem is selected. */
  h: string;
  help: string;
  /** How someone might say it, typed into the search box's placeholder. */
  say: string;
  keywords: string[];
  alt: string;
  fx: number;
  fy: number;
}

export const HERO_IMAGE = { width: 3168, height: 1344 };

export const heroImageSrc = (p: Pick<Problem, "slug">) => `/landing/hero/${p.slug}.webp`;

// "Insurance claim" is in the design but its photo isn't in the bundle. It comes back once supplied.
export const PROBLEMS: Problem[] = [
  {
    label: "Unfair dismissal",
    slug: "unfair-dismissal",
    tag: "Employment",
    h: "Lost your job unfairly?",
    help: "Tell us what happened. We explain your rights and the time limits that apply, then employment solicitors send you quotes.",
    say: "I was sacked without warning",
    keywords: ["sacked", "fired", "dismiss", "let go", "lost my job", "made redundant", "redundan", "terminated"],
    alt: "A man carries a box of his desk things along a city street, looking back over his shoulder.",
    fx: 0.36,
    fy: 0.23,
  },
  {
    label: "Deposit dispute",
    slug: "deposit-dispute",
    tag: "Housing",
    h: "Landlord keeping your deposit?",
    help: "We explain how deposit protection works and what you can ask for, then housing solicitors quote to help you get it back.",
    say: "My landlord won't return my deposit",
    keywords: ["deposit", "tenancy deposit", "landlord kept", "return my deposit"],
    alt: "A woman holds a moving box in an empty rented room with black mould on the wall.",
    fx: 0.35,
    fy: 0.29,
  },
  {
    label: "Divorce",
    slug: "divorce",
    tag: "Family",
    h: "Going through a divorce?",
    help: "We walk you through the process step by step, then family solicitors quote for the parts you want help with.",
    say: "We're getting divorced",
    keywords: ["divorce", "separat", "split up", "husband", "wife", "marriage", "ex "],
    alt: "A woman sits at her kitchen table at night with a laptop, her wedding ring on the table.",
    fx: 0.72,
    fy: 0.24,
  },
  {
    label: "Wills",
    slug: "wills",
    tag: "Wills & estates",
    h: "Need to sort out a will?",
    help: "We explain your options in plain English, then solicitors quote to write or check your will.",
    say: "I need to make a will",
    keywords: ["will", "make a will", "inherit", "power of attorney", "lpa"],
    alt: "An older man in glasses reads his will at the dining table.",
    fx: 0.37,
    fy: 0.3,
  },
  {
    label: "Employment contract",
    slug: "employment-contract",
    tag: "Employment",
    h: "Unsure about your contract?",
    help: "We point out the terms worth asking about, then a solicitor can review the contract for a quoted fee.",
    say: "I don't understand my contract",
    keywords: ["contract", "non-compete", "notice period", "job offer", "terms of employment", "settlement agreement"],
    alt: "A woman reads through an employment contract at her desk at home.",
    fx: 0.69,
    fy: 0.34,
  },
  {
    label: "Faulty car",
    slug: "faulty-car",
    tag: "Consumer",
    h: "Bought a faulty car?",
    help: "We explain your consumer rights and what to ask the seller for, then solicitors quote if you need more help.",
    say: "The car I bought keeps breaking down",
    keywords: ["car", "vehicle", "dealer", "breaking down", "garage", "faulty", "broken", "refund"],
    alt: "A man looks worriedly at his car with the bonnet up on a wet terraced street.",
    fx: 0.7,
    fy: 0.31,
  },
  {
    label: "Debt letters",
    slug: "debt-letters",
    tag: "Money",
    h: "Debt letters piling up?",
    help: "We help you understand what each letter means and what to do next, then solicitors quote to help you respond.",
    say: "Debt letters keep arriving",
    keywords: ["debt", "bailiff", "collector", "ccj", "owe", "arrears", "loan", "credit card"],
    alt: "A man reads a letter at his kitchen table, a calculator and opened envelopes in front of him.",
    fx: 0.67,
    fy: 0.29,
  },
  {
    label: "Visa and immigration",
    slug: "immigration",
    tag: "Immigration",
    h: "Questions about your visa?",
    help: "We explain the routes and steps that apply to you, then immigration solicitors quote for your case.",
    say: "My visa is running out",
    keywords: ["visa", "immigration", "home office", "settled status", "citizenship", "passport", "asylum", "deport"],
    alt: "A young man fills in forms at his kitchen table, his passport beside him.",
    fx: 0.7,
    fy: 0.3,
  },
  {
    label: "Unpaid invoice",
    slug: "unpaid-invoice",
    tag: "Business",
    h: "Client still hasn't paid?",
    help: "We explain how to recover what you're owed, then solicitors quote to chase it for you.",
    say: "A customer still hasn't paid my invoice",
    keywords: ["invoice", "customer", "client hasn", "owed", "not paid me", "still hasn", "my business"],
    alt: "A bookshop owner frowns at an unpaid invoice behind her counter.",
    fx: 0.73,
    fy: 0.31,
  },
  {
    label: "Eviction notice",
    slug: "eviction-notice",
    tag: "Housing",
    h: "Been told to leave your home?",
    help: "We explain what your notice means and how long you have, then housing solicitors quote to help.",
    say: "I've been told to move out",
    keywords: ["evict", "leave my", "section 21", "section 8", "notice to quit", "kicked out", "homeless"],
    alt: "A woman reads an eviction notice among packed boxes in her living room.",
    fx: 0.33,
    fy: 0.37,
  },
  {
    label: "Child custody",
    slug: "child-custody",
    tag: "Family",
    h: "Agreeing where the children live?",
    help: "We explain how child arrangements are decided, then family solicitors quote to help you reach an agreement.",
    say: "I can't agree on seeing my kids",
    keywords: ["custody", "child", "children", "kids", "contact with", "child arrangement", "access to my"],
    alt: "A father on the sofa looks at a child's drawing of his family.",
    fx: 0.36,
    fy: 0.35,
  },
  {
    label: "Workplace discrimination",
    slug: "workplace-discrimination",
    tag: "Employment",
    h: "Treated unfairly at work?",
    help: "We explain what counts as discrimination and the time limits, then employment solicitors send you quotes.",
    say: "I'm treated differently at work",
    keywords: ["discriminat", "harass", "bullied", "racis", "sexis", "pregnan", "disab", "treated unfairly"],
    alt: "A woman sits at her desk in an open-plan office, looking away with a guarded expression.",
    fx: 0.8,
    fy: 0.33,
  },
  {
    label: "Probate",
    slug: "probate",
    tag: "Wills & estates",
    h: "Dealing with a loved one's estate?",
    help: "We explain the probate steps in plain English, then solicitors quote to handle the parts you choose.",
    say: "I'm sorting out Mum's estate",
    keywords: ["probate", "estate", "executor", "passed away", "died", "death", "funeral"],
    alt: "A woman reads an old letter while sorting a loved one's papers among packing boxes.",
    fx: 0.75,
    fy: 0.28,
  },
  {
    label: "Neighbour dispute",
    slug: "neighbour-dispute",
    tag: "Neighbours",
    h: "Problems with a neighbour?",
    help: "We explain your options for boundaries, noise or damage, then solicitors quote if it needs to go further.",
    say: "My neighbour moved the fence",
    keywords: ["neighbour", "neighbor", "boundary", "fence", "noise", "hedge", "tree"],
    alt: "A woman in gardening gloves stands by her fence, looking at an overgrown hedge next door.",
    fx: 0.26,
    fy: 0.32,
  },
  {
    label: "Unpaid wages",
    slug: "unpaid-wages",
    tag: "Employment",
    h: "Not been paid what you're owed?",
    help: "We explain your rights on pay and how to claim it, then employment solicitors quote to help.",
    say: "My employer hasn't paid me",
    keywords: ["wages", "salary", "not been paid", "unpaid pay", "holiday pay", "overtime", "minimum wage", "payslip"],
    alt: "A café worker in an apron reads her payslip with a worried frown.",
    fx: 0.35,
    fy: 0.3,
  },
  {
    label: "Driving offence",
    slug: "driving-offence",
    tag: "Criminal",
    h: "Charged with a driving offence?",
    help: "We explain what the charge means and what happens next, then solicitors quote to represent you.",
    say: "I've been caught speeding",
    keywords: ["speeding", "driving", "drink driv", "licence", "points", "ban", "police", "court"],
    alt: "A man sits in his car reading a letter with a worried look.",
    fx: 0.71,
    fy: 0.32,
  },
  {
    label: "Landlord repairs",
    slug: "landlord-repairs",
    tag: "Housing",
    h: "Landlord ignoring repairs?",
    help: "We explain what your landlord must fix and how to ask, then housing solicitors quote to help.",
    say: "My landlord won't fix the boiler",
    keywords: ["repair", "damp", "mould", "mold", "leak", "boiler", "heating", "disrepair"],
    alt: "A man stands in a damp kitchen with a broken boiler and a stained ceiling.",
    fx: 0.67,
    fy: 0.23,
  },
  {
    label: "Domestic abuse",
    slug: "domestic-abuse",
    tag: "Family",
    h: "Need protection at home?",
    help: "If you are in danger, call 999. We explain the protection orders available, then family solicitors quote to help.",
    say: "I don't feel safe at home",
    keywords: ["abuse", "violen", "non-molestation", "protection order", "scared", "threat", "unsafe"],
    alt: "A woman sits alone on the stairs at home, looking towards the front door.",
    fx: 0.67,
    fy: 0.24,
  },
  {
    label: "Power of attorney",
    slug: "power-of-attorney",
    tag: "Wills & estates",
    h: "Planning for a parent's care?",
    help: "We explain how lasting power of attorney works, then solicitors quote to set it up.",
    say: "I need to manage Dad's affairs",
    keywords: [],
    alt: "A woman sits at a table with an older relative, forms spread between them.",
    fx: 0.35,
    fy: 0.27,
  },
  {
    label: "Accused of a crime",
    slug: "accused-of-a-crime",
    tag: "Criminal",
    h: "Been accused of a crime?",
    help: "We explain the process and your rights, then criminal defence solicitors quote to represent you.",
    say: "I've been charged with an offence",
    keywords: [],
    alt: "A man sits on a wooden bench in a court corridor, a folder on his lap.",
    fx: 0.33,
    fy: 0.23,
  },
  {
    label: "Benefits appeal",
    slug: "benefits-appeal",
    tag: "Immigration & public services",
    h: "Benefits refused or cut?",
    help: "We explain how to challenge the decision and the deadlines, then solicitors quote to help with your appeal.",
    say: "My benefits were cut",
    keywords: [],
    alt: "A woman reads a letter at a library computer, looking concerned.",
    fx: 0.41,
    fy: 0.27,
  },
  {
    label: "Asylum",
    slug: "asylum",
    tag: "Immigration",
    h: "Applying for asylum?",
    help: "We explain the stages of the process, then immigration solicitors quote for your case.",
    say: "I want to claim asylum",
    keywords: [],
    alt: "A woman waits on a chair in an office corridor holding a folder of papers.",
    fx: 0.28,
    fy: 0.21,
  },
];

/** The problem selected when the page opens. */
export const START_PROBLEM = PROBLEMS.findIndex((p) => p.label === "Employment contract");

/** The headline when no problem is selected. */
export const DEFAULT_HEADLINE = "Legal trouble, made clear.";

/** The index of the problem a search best matches, or -1. */
export function matchProblem(query: string, problems: Problem[] = PROBLEMS) {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9' -]/g, " ").replace(/\s+/g, " ")} `;
  let best = -1;
  let bestScore = 0;
  problems.forEach((p, i) => {
    const words = [...p.keywords, ...p.label.toLowerCase().split(" ").filter((w) => w.length > 3), p.tag.toLowerCase()];
    let score = 0;
    for (const w of words) if (q.includes(w)) score += w.length + (q.includes(` ${w}`) ? 2 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/** Splits a headline into the two most even lines. */
export function twoLines(text: string) {
  const words = text.split(" ");
  if (words.length < 2) return [text];
  let at = 1;
  let longest = Infinity;
  for (let i = 1; i < words.length; i++) {
    const m = Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length);
    if (m < longest) {
      longest = m;
      at = i;
    }
  }
  return [words.slice(0, at).join(" "), words.slice(at).join(" ")];
}
