import { describe, expect, it } from "vitest";
import { dragHasFiles } from "../use-file-drop";

describe("dragHasFiles", () => {
  it("is true only when the drag carries files", () => {
    expect(dragHasFiles(["text/plain", "Files"])).toBe(true);
    expect(dragHasFiles(["text/plain"])).toBe(false);
    expect(dragHasFiles(undefined)).toBe(false);
  });
});
