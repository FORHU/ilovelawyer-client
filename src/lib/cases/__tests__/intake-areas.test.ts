import { describe, it, expect } from "vitest";
import { guessAreas } from "../use-intake-chat";

const areas = [
  { code: "EMP", name: "Employment" },
  { code: "PROP", name: "Property and housing" },
  { code: "WILL", name: "Wills and probate" },
  { code: "CON", name: "Consumer and contract" },
];
const codes = (text: string) => guessAreas(text, areas).map((a) => a.code);

describe("guessAreas", () => {
  it("doesn't take everyday words for a kind of issue", () => {
    expect(codes("My landlord will not return my deposit")).toEqual(["PROP"]);
    expect(codes("The washing machine doesn't work")).toEqual([]);
    expect(codes("I read the contract twice")).toEqual([]);
  });

  it("still reads the clear cases", () => {
    expect(codes("My boss fired me without notice")).toEqual(["EMP"]);
    expect(codes("I worked for them for six years")).toEqual(["EMP"]);
    expect(codes("My father died and left a will")).toEqual(["WILL"]);
    expect(codes("This is a breach of contract")).toEqual(["CON"]);
  });
});
