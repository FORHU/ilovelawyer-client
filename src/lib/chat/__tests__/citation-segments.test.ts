import { describe, it, expect } from "vitest";
import { citationSegments } from "../citation-segments";

describe("citationSegments", () => {
  it("returns a single text segment when there's no citation", () => {
    expect(citationSegments("No citations here.")).toEqual([{ kind: "text", text: "No citations here." }]);
  });

  it("splits a citation out from the surrounding text", () => {
    const text = "See [Employment Rights Act 1996, section 94](https://www.legislation.gov.uk/ukpga/1996/18/section/94) for the right.";
    expect(citationSegments(text)).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", label: "Employment Rights Act 1996, section 94", href: "https://www.legislation.gov.uk/ukpga/1996/18/section/94" },
      { kind: "text", text: " for the right." },
    ]);
  });

  it("handles two citations back to back with nothing but a space between them", () => {
    const text = "[section 112](https://www.legislation.gov.uk/ukpga/1996/18/section/112) and [section 123](https://www.legislation.gov.uk/ukpga/1996/18/section/123) both apply.";
    const segments = citationSegments(text);
    expect(segments.filter((s) => s.kind === "link")).toHaveLength(2);
    expect(segments[1]).toEqual({ kind: "text", text: " and " });
  });

  it("leaves plain bracketed text that isn't a markdown link alone", () => {
    expect(citationSegments("[not a link] but still text")).toEqual([{ kind: "text", text: "[not a link] but still text" }]);
  });

  it("returns nothing for an empty string", () => {
    expect(citationSegments("")).toEqual([]);
  });
});
