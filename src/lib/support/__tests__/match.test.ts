import { describe, expect, it } from "vitest";
import { matchFlows, normalize } from "../match";
import { content } from "./fixtures";

describe("normalize", () => {
  it("lowers case, drops punctuation and folds plurals", () => {
    expect(normalize("  I was CHARGED twice!! ")).toBe("i was charged twice");
    expect(normalize("Refunds, please.")).toBe("refund please");
    expect(normalize("don't")).toBe("dont");
  });
});

describe("matchFlows", () => {
  it("suggests the flow whose trigger is in the text", () => {
    expect(matchFlows("I need a refund", content.flows).map((m) => m.flowId)).toEqual(["refund"]);
  });

  it("matches a phrase as a whole, and ignores a word inside another word", () => {
    expect(matchFlows("my card declined at checkout", content.flows).map((m) => m.flowId)).toEqual(["payment"]);
    expect(matchFlows("creditworthy", content.flows)).toEqual([]);
  });

  it("answers at most three, best first", () => {
    const many = Object.fromEntries(
      ["a", "b", "c", "d"].map((id, i) => [id, { ...content.flows.refund, id, title: id, triggers: i === 0 ? ["help", "help me", "please help"] : ["help"] }]),
    );
    const found = matchFlows("please help me", many);
    expect(found).toHaveLength(3);
    expect(found[0].flowId).toBe("a");
  });

  it("finds nothing worth suggesting when no trigger is there", () => {
    expect(matchFlows("what's the weather", content.flows)).toEqual([]);
    expect(matchFlows("   ", content.flows)).toEqual([]);
  });
});
