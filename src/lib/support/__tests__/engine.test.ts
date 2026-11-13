import { describe, expect, it } from "vitest";
import { fillGreeting, initialState, reduce, typingDelay, type ChatAction, type ChatState } from "../engine";
import type { SupportOutcomeEvent } from "../types";
import { content } from "./fixtures";

/** Plays actions in order and gathers everything reported on the way. */
function play(actions: ChatAction[], from: ChatState = initialState(content, "Sam")) {
  let state = from;
  const events: SupportOutcomeEvent[] = [];
  for (const action of actions) {
    const next = reduce(content, state, action);
    state = next.state;
    events.push(...next.events);
  }
  return { state, events };
}

const texts = (state: ChatState, who: "bot" | "user") => state.messages.filter((m) => m.from === who).map((m) => m.text);

describe("fillGreeting", () => {
  it("puts the first name in", () => {
    expect(fillGreeting("Hi {firstName}, how can we help?", "Sam")).toBe("Hi Sam, how can we help?");
  });

  it("drops the placeholder cleanly for someone who isn't signed in", () => {
    expect(fillGreeting("Hi {firstName}, how can we help?", null)).toBe("Hi, how can we help?");
    expect(fillGreeting("Hello {firstName}!", null)).toBe("Hello!");
    expect(fillGreeting("{firstName}, welcome back.", null)).toBe("Welcome back.");
    expect(fillGreeting("How can we help?", null)).toBe("How can we help?");
  });
});

describe("a conversation", () => {
  it("opens with the greeting and the topics", () => {
    const state = initialState(content, "Sam");
    expect(texts(state, "bot")).toEqual(["Hi Sam, how can we help?"]);
    expect(state.prompt).toEqual({ kind: "MENU" });
  });

  it("walks a flow to its question and reports that it started", () => {
    const { state, events } = play([{ type: "START_FLOW", flowId: "payment", label: "Payments" }]);
    expect(texts(state, "user")).toEqual(["Payments"]);
    expect(texts(state, "bot")).toContain("Payments can take a minute.");
    expect(state.prompt).toEqual({ kind: "HELP" });
    expect(events).toEqual([{ kind: "FLOW_STARTED", flowId: "payment", contentVersion: 7 }]);
  });

  it("follows a choice to a message, then a link, then back to the topics", () => {
    const { state } = play([{ type: "START_FLOW", flowId: "credits" }, { type: "CHOOSE", index: 0 }]);
    expect(texts(state, "bot")).toContain("On each case.");
    expect(state.messages.find((m) => m.link)?.link).toEqual({ href: "/cases", label: "Open my cases" });
    expect(state.prompt).toEqual({ kind: "MENU" });
    expect(state.flowId).toBeNull();
  });

  it("ignores a choice that isn't on offer", () => {
    const before = initialState(content, null);
    expect(reduce(content, before, { type: "CHOOSE", index: 0 }).state).toBe(before);
  });
});

describe("Did that help?", () => {
  const asked: ChatAction[] = [{ type: "START_FLOW", flowId: "payment" }];

  it("ends the flow on Yes", () => {
    const { state, events } = play([...asked, { type: "ANSWER_HELP", helped: true }]);
    expect(events.map((e) => e.kind)).toEqual(["FLOW_STARTED", "HELPED_YES"]);
    expect(state.prompt).toEqual({ kind: "MENU" });
    expect(state.flowId).toBeNull();
  });

  it("offers the related flows on the first No", () => {
    const { state, events } = play([...asked, { type: "ANSWER_HELP", helped: false }]);
    expect(events.map((e) => e.kind)).toEqual(["FLOW_STARTED", "HELPED_NO"]);
    expect(state.prompt).toEqual({ kind: "SUGGESTIONS", flowIds: ["credits", "second"] });
  });

  it("offers a person on the second No", () => {
    const { state, events } = play([
      ...asked,
      { type: "ANSWER_HELP", helped: false },
      { type: "PICK_SUGGESTION", flowId: "second" },
      { type: "ANSWER_HELP", helped: false },
    ]);
    expect(state.prompt).toEqual({ kind: "TALK_OFFER" });
    expect(events.filter((e) => e.kind === "HELPED_NO")).toHaveLength(2);
  });

  it("offers a person straight away when the flow has nothing related", () => {
    const lonely = { ...content, flows: { ...content.flows, payment: { ...content.flows.payment, relatedFlowIds: [] } } };
    let state = reduce(lonely, initialState(lonely, null), { type: "START_FLOW", flowId: "payment" }).state;
    state = reduce(lonely, state, { type: "ANSWER_HELP", helped: false }).state;
    expect(state.prompt.kind).toBe("TALK_OFFER");
  });

  it("hands over to a person when asked", () => {
    const { state } = play([...asked, { type: "ANSWER_HELP", helped: false }, { type: "PICK_SUGGESTION", flowId: "second" }, { type: "ANSWER_HELP", helped: false }, { type: "TALK" }]);
    expect(state.prompt).toEqual({ kind: "TALK" });
  });
});

describe("typed text", () => {
  it("suggests up to three matching flows", () => {
    const { state } = play([{ type: "TYPE", text: "I was charged twice" }]);
    expect(state.prompt).toEqual({ kind: "SUGGESTIONS", flowIds: ["payment"] });
  });

  it("starts the flow picked from the suggestions", () => {
    const { state, events } = play([{ type: "TYPE", text: "refund please" }, { type: "PICK_SUGGESTION", flowId: "refund" }]);
    expect(events).toEqual([{ kind: "FLOW_STARTED", flowId: "refund", contentVersion: 7 }]);
    expect(state.prompt).toEqual({ kind: "TALK" });
  });

  it("doesn't start a flow that wasn't suggested", () => {
    const before = play([{ type: "TYPE", text: "refund please" }]).state;
    expect(reduce(content, before, { type: "PICK_SUGGESTION", flowId: "credits" }).state).toBe(before);
  });

  it("reports the first miss and asks for other words", () => {
    const { state, events } = play([{ type: "TYPE", text: "purple monkey dishwasher" }]);
    expect(events).toEqual([{ kind: "UNMATCHED", text: "purple monkey dishwasher", contentVersion: 7 }]);
    expect(state.prompt).toEqual({ kind: "MENU" });
  });

  it("offers a person after two misses in a row", () => {
    const { state } = play([{ type: "TYPE", text: "purple monkey" }, { type: "TYPE", text: "dishwasher" }]);
    expect(state.prompt).toEqual({ kind: "TALK_OFFER" });
  });

  it("counts only misses that follow each other", () => {
    const { state } = play([{ type: "TYPE", text: "purple monkey" }, { type: "TYPE", text: "refund" }, { type: "TYPE", text: "dishwasher" }]);
    expect(state.prompt).toEqual({ kind: "MENU" });
    expect(state.misses).toBe(1);
  });

  it("ignores empty text and text sent while a person has taken over", () => {
    const start = initialState(content, null);
    expect(reduce(content, start, { type: "TYPE", text: "   " }).state).toBe(start);
    const handed = play([{ type: "START_FLOW", flowId: "refund" }]).state;
    expect(reduce(content, handed, { type: "TYPE", text: "hello" }).state).toBe(handed);
  });
});

describe("talking to a person", () => {
  it("is reached by a flow that says so", () => {
    const { state } = play([{ type: "START_FLOW", flowId: "credits" }, { type: "CHOOSE", index: 1 }]);
    expect(state.prompt).toEqual({ kind: "TALK" });
  });
});

describe("actions", () => {
  it("waits for the action, then follows its success or failure", () => {
    const waiting = play([{ type: "START_FLOW", flowId: "action" }]).state;
    expect(waiting.prompt.kind).toBe("ACTION");
    expect(play([{ type: "ACTION_RESULT", ok: true }], waiting).state.prompt).toEqual({ kind: "MENU" });
    const failed = play([{ type: "ACTION_RESULT", ok: false, text: "Not yet." }], waiting).state;
    expect(texts(failed, "bot")).toEqual(expect.arrayContaining(["Not yet.", "Couldn't check that."]));
  });
});

describe("content that doesn't hold together", () => {
  it("doesn't loop forever", () => {
    const { state } = play([{ type: "START_FLOW", flowId: "loop" }]);
    expect(state.prompt.kind).toBe("TALK_OFFER");
  });

  it("offers a person when a step points nowhere", () => {
    const { state } = play([{ type: "START_FLOW", flowId: "missing" }]);
    expect(state.prompt.kind).toBe("TALK_OFFER");
  });

  it("offers a person for a flow that no longer exists", () => {
    const { state } = play([{ type: "START_FLOW", flowId: "gone" }]);
    expect(state.prompt.kind).toBe("TALK_OFFER");
  });
});

describe("returning to the topics", () => {
  it("shows them again", () => {
    const { state } = play([{ type: "TYPE", text: "refund" }, { type: "SHOW_MENU" }]);
    expect(state.prompt).toEqual({ kind: "MENU" });
  });
});

describe("an action's result", () => {
  it("shows a card under the assistant's message, then carries on", () => {
    const waiting = play([{ type: "START_FLOW", flowId: "action" }]).state;
    const card = { kind: "CREDITS" as const, cases: [{ caseId: "c1", title: "Dispute", credits: 12 }] };
    const { state } = play([{ type: "ACTION_RESULT", ok: true, text: "Here you go.", card }], waiting);
    const shown = state.messages.find((m) => m.card);
    expect(shown).toMatchObject({ from: "bot", text: "Here you go.", card });
  });

  it("shows a card even with no words of its own", () => {
    const waiting = play([{ type: "START_FLOW", flowId: "action" }]).state;
    const card = { kind: "BLOCKING" as const, requests: [] };
    expect(play([{ type: "ACTION_RESULT", ok: false, card }], waiting).state.messages.some((m) => m.card)).toBe(true);
  });
});

describe("typingDelay", () => {
  const bot = (text: string) => ({ id: 1, from: "bot" as const, text });

  it("shows the client's own words at once", () => {
    expect(typingDelay({ id: 1, from: "user", text: "hello" })).toBe(0);
  });

  it("waits longer for more to read, but never long enough to feel stuck", () => {
    const short = typingDelay(bot("Done."));
    const medium = typingDelay(bot("Check your spam folder first, then try again in a minute."));
    const long = typingDelay(bot(Array.from({ length: 80 }, () => "word").join(" ")));
    expect(short).toBeLessThan(medium);
    expect(medium).toBeLessThan(long);
    expect(long).toBe(900);
  });

  it("is brief for a result that is all card and no words", () => {
    expect(typingDelay({ id: 1, from: "bot", text: "" })).toBe(300);
  });
});
