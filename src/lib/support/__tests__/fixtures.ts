import type { PublishedSupportContent, SupportFlow } from "../types";

const flow = (id: string, title: string, triggers: string[], steps: SupportFlow["steps"], startStepId: string, relatedFlowIds: string[] = []): SupportFlow => ({
  id,
  title,
  audience: "BOTH",
  triggers,
  relatedFlowIds,
  startStepId,
  steps,
});

export const content: PublishedSupportContent = {
  version: 7,
  publishedAt: "2026-11-01T00:00:00.000Z",
  settings: { assistantName: "Lexi", avatarUrl: null, greeting: "Hi {firstName}, how can we help?", responseTimeLine: "We reply within one working day." },
  menu: [
    { id: "m1", title: "Payments", flowId: "payment", enabled: true },
    { id: "m2", title: "Credits", flowId: "credits", enabled: true },
  ],
  actions: [],
  flows: {
    payment: flow(
      "payment",
      "A payment didn't go through",
      ["payment", "charged twice", "card declined"],
      {
        a: { id: "a", type: "MESSAGE", text: "Payments can take a minute.", next: { kind: "STEP", stepId: "b" } },
        b: { id: "b", type: "DID_THAT_HELP" },
      },
      "a",
      ["credits", "second"],
    ),
    credits: flow("credits", "My credits", ["credit", "balance"], {
      a: { id: "a", type: "CHOICES", style: "BUTTONS", text: "What about them?", options: [{ label: "Where are they?", target: { kind: "STEP", stepId: "b" } }, { label: "Talk to someone", target: { kind: "TALK_TO_PERSON" } }] },
      b: { id: "b", type: "MESSAGE", text: "On each case.", next: { kind: "LINK", href: "/cases", label: "Open my cases" } },
    }, "a"),
    refund: flow("refund", "Refund", ["refund", "money back"], { a: { id: "a", type: "MESSAGE", text: "Refunds go through a person.", next: { kind: "TALK_TO_PERSON" } } }, "a"),
    action: flow("action", "Re-check payment", ["recheck"], { a: { id: "a", type: "ACTION", actionKey: "CHECK_PAYMENT", onSuccess: { kind: "END" }, onFailure: { kind: "STEP", stepId: "b" } }, b: { id: "b", type: "MESSAGE", text: "Couldn't check that." } }, "a"),
    second: flow("second", "Another try", [], { a: { id: "a", type: "DID_THAT_HELP" } }, "a"),
    loop: flow("loop", "Loops", ["loop"], { a: { id: "a", type: "MESSAGE", text: "again", next: { kind: "STEP", stepId: "a" } } }, "a"),
    missing: flow("missing", "Missing", ["missing"], { a: { id: "a", type: "MESSAGE", text: "x", next: { kind: "STEP", stepId: "gone" } } }, "a"),
  },
};
