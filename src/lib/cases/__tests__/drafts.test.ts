import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_BUDGET_DRAFT } from "../budget";
import { draftTitle, draftWhen, formHasContent, putDraft, useDrafts, type DraftChat, type DraftForm, type OpenDraft } from "../drafts";

const FORM: DraftForm = { title: "", region: "", where: "", areas: [], side: "", others: [], happened: "", wants: "", budget: EMPTY_BUDGET_DRAFT };
const CHAT: DraftChat = {
  messages: [],
  step: "start",
  draft: { title: "", happened: "", wants: "", areas: [], region: "", where: "", side: "", others: [] },
  asked: [],
  text: "",
};
const open = (patch: Partial<OpenDraft> = {}): OpenDraft => ({ id: "d1", ownerId: "u1", mode: "chat", chat: CHAT, chatFiles: [], form: FORM, formFiles: [], ...patch });

describe("draftTitle", () => {
  it("prefers the form's title, then the chat's, then the first thing said, then what's typed", () => {
    const said = { ...CHAT, messages: [{ id: 1, role: "user" as const, text: "My landlord kept my deposit" }] };
    expect(draftTitle({ form: { ...FORM, title: "Deposit" }, chat: said })).toBe("Deposit");
    expect(draftTitle({ form: FORM, chat: { ...said, draft: { ...said.draft, title: "Deposit dispute" } } })).toBe("Deposit dispute");
    expect(draftTitle({ form: FORM, chat: said })).toBe("My landlord kept my deposit");
    expect(draftTitle({ form: FORM, chat: { ...CHAT, text: "  I was\nfired " } })).toBe("I was fired");
    expect(draftTitle({ form: FORM, chat: null })).toBe("Untitled draft");
  });

  it("is cut short with an ellipsis", () => {
    const title = draftTitle({ form: { ...FORM, title: "a".repeat(200) }, chat: null });
    expect(title).toHaveLength(80);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("draftWhen", () => {
  it("shows the time today and the date before", () => {
    const now = new Date(2026, 10, 4, 15, 0).getTime();
    expect(draftWhen(new Date(2026, 10, 4, 9, 5).getTime(), now)).toBe("09:05");
    expect(draftWhen(new Date(2026, 10, 3, 9, 5).getTime(), now)).toBe("3 Nov");
  });
});

describe("formHasContent", () => {
  it("counts any answer, but not an empty other-party row or the budget", () => {
    expect(formHasContent(FORM)).toBe(false);
    expect(formHasContent({ ...FORM, others: [{ id: "o1", name: " ", role: "Opposing party" }] })).toBe(false);
    expect(formHasContent({ ...FORM, budget: { ...EMPTY_BUDGET_DRAFT, choice: "UNDER_500" } })).toBe(false);
    expect(formHasContent({ ...FORM, where: "Leeds" })).toBe(true);
  });
});

describe("putDraft", () => {
  beforeEach(() => useDrafts.setState({ drafts: {} }));

  it("keeps nothing while New case is empty", () => {
    expect(putDraft(open())).toBe(false);
    expect(useDrafts.getState().drafts).toEqual({});
  });

  it("saves typed text, a conversation, form answers or files", () => {
    expect(putDraft(open({ chat: { ...CHAT, text: "I lost my job" } }))).toBe(true);
    expect(useDrafts.getState().drafts.d1?.chat?.text).toBe("I lost my job");
    expect(putDraft(open({ id: "d2", mode: "form", chat: null, form: { ...FORM, title: "Unpaid wages" } }))).toBe(true);
    expect(putDraft(open({ id: "d3", chatFiles: [new File(["x"], "contract.pdf")] }))).toBe(true);
    expect(useDrafts.getState().drafts.d3?.fileCount).toBe(1);
  });

  it("drops the draft once everything in it is cleared", () => {
    putDraft(open({ chat: { ...CHAT, text: "I lost my job" } }));
    expect(putDraft(open())).toBe(false);
    expect(useDrafts.getState().drafts.d1).toBeUndefined();
  });

  it("doesn't move an unchanged draft up the list", () => {
    putDraft(open({ chat: { ...CHAT, text: "I lost my job" } }));
    useDrafts.setState((s) => ({ drafts: { d1: { ...s.drafts.d1!, updatedAt: 1 } } }));
    putDraft(open({ chat: { ...CHAT, text: "I lost my job" } }));
    expect(useDrafts.getState().drafts.d1?.updatedAt).toBe(1);
    putDraft(open({ chat: { ...CHAT, text: "I lost my job last week" } }));
    expect(useDrafts.getState().drafts.d1?.updatedAt).toBeGreaterThan(1);
  });
});
