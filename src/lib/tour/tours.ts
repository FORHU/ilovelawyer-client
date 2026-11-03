// The client app's guided tour, from the design in "ilovelawyer - client side guided tour":
// T0 is the welcome card (no steps), T1 the Cases page, T2 the hint card on New case, T3 a first
// case, T4 the Lawyer tab, T5 the chat on New case (a new account lands there, not on Cases). Targets are `data-tour="…"` attributes in the screens.

export type Placement = "top" | "bottom" | "left" | "right";

export type TourId = "T1" | "T3" | "T4" | "T5";
/** What a user has been through. T0 and T2 are a card, not a spotlight tour. */
export type SeenKey = "T0" | "T2" | TourId;

export interface TourStep {
  /** The `data-tour` value of the control to spotlight. */
  target: string;
  /** Spotlighted instead when the target isn't on screen (a menu on a phone, say). */
  fallback?: string;
  placement: Placement;
  title: string;
  body: string;
  /** On a phone the step only shows the control: it can't be tapped, so the keyboard never opens. */
  lookOnPhone?: boolean;
}

export interface TourDef {
  kicker: string;
  steps: TourStep[];
}

export interface TourContext {
  /** The credits every case comes with, once the pricing has loaded. */
  credits: number | null;
}

export function tourFor(id: TourId, { credits }: TourContext): TourDef {
  switch (id) {
    case "T1":
      return {
        kicker: "Cases",
        steps: [
          { target: "new-case", placement: "bottom", title: "Start your first case", body: "Start here. It takes about two minutes, and your answers save as you go." },
          {
            target: "cases-credits",
            placement: "bottom",
            title: "Credits",
            body: `Every case is free and comes with ${credits ?? "some"} chat credits for the AI interview. You can top up later.`,
          },
          { target: "guide", placement: "right", title: "Guide", body: "Lost? Open the guide to replay this tour or ask how something works." },
        ],
      };
    case "T3":
      return {
        kicker: "Your case",
        steps: [
          { target: "composer", placement: "top", lookOnPhone: true, title: "The interview", body: "The AI starts from what you told us and asks what's missing. Answer in your own words." },
          { target: "tab-overview", placement: "bottom", title: "Overview", body: "Your answers, organised into a case summary. It shows what's ready and what still needs filling in." },
          { target: "tab-docs", placement: "bottom", title: "Documents", body: "Add contracts, letters and screenshots. The AI reads them and cites them in your overview." },
          {
            target: "case-credits",
            placement: "bottom",
            title: "Credits",
            body: `Each AI reply uses a credit.${credits ? ` You started with ${credits}.` : ""}`,
          },
          {
            target: "get-lawyer",
            fallback: "case-menu",
            placement: "bottom",
            title: "Get a lawyer",
            body: "When your overview is ready, send it to a solicitor for a quote. Nothing is shared until you choose to.",
          },
        ],
      };
    case "T5":
      return {
        kicker: "New case",
        steps: [
          {
            target: "chatbox",
            placement: "bottom",
            lookOnPhone: true,
            title: "Tell us what's going on",
            body: "Type in your own words. The AI asks a few questions, then you check the details before your case is created.",
          },
          { target: "mic", placement: "bottom", title: "Or use your voice", body: "Tap the mic and talk. You can edit the text before you send it." },
          { target: "starters", placement: "bottom", title: "Not sure where to start?", body: "Tap one of these to begin." },
          { target: "opt-form", placement: "bottom", title: "Prefer a form?", body: "Fill in the same details in a short form instead." },
        ],
      };
    case "T4":
      return {
        kicker: "Your lawyer",
        steps: [
          { target: "request-status", placement: "bottom", title: "Your request", body: "We're finding a solicitor. You'll get a quote here, usually within a day." },
          { target: "lawyer-messages", placement: "top", title: "Messages", body: "Talk to your solicitor here once you accept their quote." },
        ],
      };
  }
}

/** Where the guide is being opened: decides its questions and what "Tour this page" runs. */
export type GuideContext = "cases" | "new-case" | "case" | "lawyer";

/** `tab` is the case page's selected tab (its `data-tour`, e.g. "tab-chat"), when on a case. */
export function guideContext(pathname: string, tab: string | null): GuideContext | null {
  if (pathname === "/cases") return "cases";
  if (pathname === "/cases/new") return "new-case";
  if (/^\/cases\/[^/]+$/.test(pathname)) return tab === "tab-lawyer" ? "lawyer" : "case";
  return null;
}

/** The tour "Tour this page" runs. The New case form has a hint card instead (see TourLayer). */
export function tourForContext(context: GuideContext | null): TourId | null {
  if (context === "cases") return "T1";
  if (context === "new-case") return "T5";
  if (context === "case") return "T3";
  if (context === "lawyer") return "T4";
  return null;
}

export interface GuideQuestion {
  question: string;
  step: TourStep;
}

/** "How do I…" shortcuts: each one spotlights a single control, the way a tour step does. */
export function guideQuestions(context: GuideContext | null, tour: TourContext): GuideQuestion[] {
  if (context === "cases") {
    const [start, credits] = tourFor("T1", tour).steps;
    return [
      { question: "How do I start a case?", step: start },
      { question: "What are credits?", step: credits },
    ];
  }
  if (context === "new-case") {
    const [chat, , , form] = tourFor("T5", tour).steps;
    return [
      { question: "How do I start a case?", step: chat },
      { question: "Can I use a form instead?", step: form },
    ];
  }
  if (context === "case") {
    const steps = tourFor("T3", tour).steps;
    return [
      { question: "Where do I add documents?", step: steps[2] },
      { question: "How do I get a lawyer?", step: steps[4] },
      { question: "How many credits do I have?", step: steps[3] },
    ];
  }
  if (context === "lawyer") {
    const [status, messages] = tourFor("T4", tour).steps;
    return [
      { question: "Where will my quote appear?", step: status },
      { question: "How do I message my solicitor?", step: messages },
    ];
  }
  return [];
}
