import { describe, expect, it } from "vitest";
import { fixTransparentCellColors, previewKind } from "../preview-kind";

describe("previewKind", () => {
  it.each([
    ["Contract.PDF", "pdf"],
    ["photo.jpeg", "image"],
    ["scan.png", "image"],
    ["letter.docx", "docx"],
    ["sheet.xlsx", "xlsx"],
    ["notes.txt", "text"],
    ["old.doc", "none"],
    ["old.xls", "none"],
    ["noextension", "none"],
  ])("%s -> %s", (name, kind) => {
    expect(previewKind(name)).toBe(kind);
  });
});

describe("fixTransparentCellColors", () => {
  it("makes alpha-0 colours opaque and leaves others alone", () => {
    expect(fixTransparentCellColors("color:rgba(31, 58, 95,0);fill:rgba(1,2,3,0.5)")).toBe(
      "color:rgba(31, 58, 95,1);fill:rgba(1,2,3,0.5)",
    );
  });
});
